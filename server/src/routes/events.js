import { Router } from 'express';
import mongoose from 'mongoose';
import { body } from 'express-validator';
import Event from '../models/Event.js';
import Attendance from '../models/Attendance.js';
import Connection from '../models/Connection.js';
import { requireAuth } from '../middleware/auth.js';
import { checkValidation } from '../middleware/error.js';
import { makeJoinCode, makeStarCode, uniqueCode } from '../utils/codes.js';
import { starPositionForIndex } from '../utils/starPosition.js';
import { primaryCategory } from '../utils/skills.js';
import { emitToEvent } from '../socket.js';

const router = Router();

// POST /api/events — host creates an event
router.post(
  '/',
  requireAuth,
  body('name').trim().isLength({ min: 3, max: 120 }),
  body('description').optional().isLength({ max: 600 }),
  body('theme').optional().isIn(['midnight', 'nebula', 'aurora']),
  checkValidation,
  async (req, res, next) => {
    try {
      const joinCode = await uniqueCode(makeJoinCode, async (code) =>
        Boolean(await Event.exists({ joinCode: code }))
      );

      const event = await Event.create({
        name: req.body.name,
        description: req.body.description || '',
        venue: req.body.venue || '',
        startsAt: req.body.startsAt || new Date(),
        endsAt: req.body.endsAt,
        theme: req.body.theme || 'midnight',
        hostId: req.user._id,
        joinCode,
      });

      // The host is an attendee too, otherwise their own sky has no star for them.
      await joinEvent(event, req.user._id);

      return res.status(201).json({ event: event.toPublic() });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/events/mine — events I host or attend
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const attendances = await Attendance.find({ userId: req.user._id }).select('eventId');
    const ids = attendances.map((a) => a.eventId);
    const events = await Event.find({ $or: [{ _id: { $in: ids } }, { hostId: req.user._id }] }).sort(
      { startsAt: -1 }
    );

    const counts = await Attendance.aggregate([
      { $match: { eventId: { $in: events.map((e) => e._id) } } },
      { $group: { _id: '$eventId', attendees: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.attendees]));

    return res.json({
      events: events.map((e) => ({
        ...e.toPublic(),
        attendees: countMap.get(String(e._id)) || 0,
        isHost: String(e.hostId) === String(req.user._id),
      })),
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/events/join — join with a code
router.post(
  '/join',
  requireAuth,
  body('joinCode').trim().isLength({ min: 4, max: 10 }),
  checkValidation,
  async (req, res, next) => {
    try {
      const event = await Event.findOne({ joinCode: req.body.joinCode.toUpperCase() });
      if (!event) return res.status(404).json({ error: 'No event with that code' });
      if (!event.isOpen) return res.status(403).json({ error: 'This event is closed' });

      const attendance = await joinEvent(event, req.user._id);

      emitToEvent(event._id, 'star:joined', {
        userId: String(req.user._id),
        name: req.user.name,
        starPosition: attendance.starPosition,
        category: primaryCategory(req.user.skills),
      });

      return res.json({ event: event.toPublic(), attendance });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/events/:id — event detail + whether I'm in it
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'No such event' });

    const mine = await Attendance.findOne({ eventId: event._id, userId: req.user._id });
    return res.json({
      event: event.toPublic(),
      isHost: String(event.hostId) === String(req.user._id),
      attendance: mine,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/events/:id/sky
 * The one call the sky view needs: every star and every line.
 */
router.get('/:id/sky', requireAuth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'No such event' });

    const attendances = await Attendance.find({ eventId: event._id })
      .populate('userId', 'name headline skills interests avatarUrl socials bio')
      .lean();

    const connections = await Connection.find({ eventId: event._id })
      .select('userA userB createdAt method')
      .lean();

    const nodes = attendances
      .filter((a) => a.userId) // guard against a deleted user
      .map((a) => ({
        id: String(a.userId._id),
        name: a.userId.name,
        headline: a.userId.headline,
        skills: a.userId.skills || [],
        interests: a.userId.interests || [],
        avatarUrl: a.userId.avatarUrl,
        bio: a.userId.bio,
        socials: a.userId.socials,
        category: primaryCategory(a.userId.skills),
        connectionCount: a.connectionCount,
        x: a.starPosition.x,
        y: a.starPosition.y,
        starCode: String(a.userId._id) === String(req.user._id) ? a.starCode : undefined,
        isMe: String(a.userId._id) === String(req.user._id),
      }));

    const links = connections.map((c) => ({
      source: String(c.userA),
      target: String(c.userB),
      createdAt: c.createdAt,
      method: c.method,
    }));

    return res.json({ event: event.toPublic(), nodes, links });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/events/:id/stats
 * Aggregation pipelines — the "insights" tier of the project.
 */
router.get('/:id/stats', requireAuth, async (req, res, next) => {
  try {
    const eventId = new mongoose.Types.ObjectId(req.params.id);

    const [totals] = await Attendance.aggregate([
      { $match: { eventId } },
      { $group: { _id: null, attendees: { $sum: 1 }, totalDegree: { $sum: '$connectionCount' } } },
    ]);

    const connectionCount = await Connection.countDocuments({ eventId });

    // Busiest skill: unwind every attendee's skills and count them.
    const topSkills = await Attendance.aggregate([
      { $match: { eventId } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $unwind: '$user.skills' },
      { $group: { _id: { $toLower: '$user.skills' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, skill: '$_id', count: 1 } },
    ]);

    // Most connected attendees.
    const topConnectors = await Attendance.aggregate([
      { $match: { eventId } },
      { $sort: { connectionCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          name: '$user.name',
          connectionCount: 1,
        },
      },
    ]);

    // Connections over time, bucketed per hour, for the chart.
    const timeline = await Connection.aggregate([
      { $match: { eventId } },
      {
        $group: {
          _id: { $dateTrunc: { date: '$createdAt', unit: 'hour' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, hour: '$_id', count: 1 } },
    ]);

    const attendees = totals?.attendees || 0;

    return res.json({
      attendees,
      connections: connectionCount,
      averageConnections: attendees ? Number(((totals.totalDegree || 0) / attendees).toFixed(2)) : 0,
      /** How much of the sky is actually drawn, out of every possible pair. */
      density:
        attendees > 1
          ? Number(((connectionCount / ((attendees * (attendees - 1)) / 2)) * 100).toFixed(1))
          : 0,
      topSkills,
      topConnectors,
      timeline,
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/events/:id/attendees/:userId — host removes someone
router.delete('/:id/attendees/:userId', requireAuth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'No such event' });
    if (String(event.hostId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the host can remove attendees' });
    }
    if (String(event.hostId) === String(req.params.userId)) {
      return res.status(400).json({ error: 'The host cannot be removed' });
    }

    await Attendance.deleteOne({ eventId: event._id, userId: req.params.userId });
    await Connection.deleteMany({
      eventId: event._id,
      $or: [{ userA: req.params.userId }, { userB: req.params.userId }],
    });

    emitToEvent(event._id, 'star:removed', { userId: req.params.userId });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/events/:id — host edits, including opening/closing
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'No such event' });
    if (String(event.hostId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the host can edit this event' });
    }

    for (const key of ['name', 'description', 'venue', 'startsAt', 'endsAt', 'theme', 'isOpen']) {
      if (req.body[key] !== undefined) event[key] = req.body[key];
    }
    await event.save();
    return res.json({ event: event.toPublic() });
  } catch (err) {
    return next(err);
  }
});

/** Shared by create + join: idempotent, allocates a fixed star position. */
async function joinEvent(event, userId) {
  const existing = await Attendance.findOne({ eventId: event._id, userId });
  if (existing) return existing;

  const index = await Attendance.countDocuments({ eventId: event._id });
  const starCode = await uniqueCode(makeStarCode, async (code) =>
    Boolean(await Attendance.exists({ eventId: event._id, starCode: code }))
  );

  return Attendance.create({
    userId,
    eventId: event._id,
    starPosition: starPositionForIndex(index),
    starCode,
  });
}

export default router;
