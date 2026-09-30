import { Router } from 'express';
import { body } from 'express-validator';
import Connection, { sortPair } from '../models/Connection.js';
import Attendance from '../models/Attendance.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { checkValidation } from '../middleware/error.js';
import { emitToEvent } from '../socket.js';

const router = Router();

/**
 * POST /api/connections
 * Body: { eventId, starCode, method?, note? }
 *
 * Connections are mutual the instant they're made: scanning a QR code (or
 * typing the 4-character star code off someone's screen) already required
 * being in the same room, so there's no pending state to approve.
 */
router.post(
  '/',
  requireAuth,
  body('eventId').isMongoId().withMessage('eventId must be a valid id'),
  body('starCode').trim().isLength({ min: 3, max: 6 }).withMessage('Star code looks wrong'),
  body('method').optional().isIn(['qr', 'code']),
  body('note').optional().isLength({ max: 200 }),
  checkValidation,
  async (req, res, next) => {
    try {
      const { eventId, starCode, method = 'code', note = '' } = req.body;

      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ error: 'No such event' });

      const mine = await Attendance.findOne({ eventId, userId: req.user._id });
      if (!mine) return res.status(403).json({ error: 'Join the event before connecting' });

      const theirs = await Attendance.findOne({ eventId, starCode: starCode.toUpperCase() });
      if (!theirs) return res.status(404).json({ error: 'No star with that code in this event' });
      if (String(theirs.userId) === String(req.user._id)) {
        return res.status(400).json({ error: "That's your own star" });
      }

      const pair = sortPair(req.user._id, theirs.userId);
      const already = await Connection.findOne({ eventId, ...pair });
      if (already) return res.status(409).json({ error: "You're already connected" });

      const connection = await Connection.create({
        eventId,
        ...pair,
        method,
        note,
        initiatedBy: req.user._id,
      });

      await Attendance.updateMany(
        { eventId, userId: { $in: [req.user._id, theirs.userId] } },
        { $inc: { connectionCount: 1 } }
      );

      const other = await User.findById(theirs.userId);

      emitToEvent(eventId, 'line:drawn', {
        source: String(pair.userA),
        target: String(pair.userB),
        createdAt: connection.createdAt,
        method,
      });

      return res.status(201).json({
        connection: {
          id: connection._id,
          source: String(pair.userA),
          target: String(pair.userB),
          createdAt: connection.createdAt,
        },
        with: other ? other.toPublic() : null,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "You're already connected" });
      }
      return next(err);
    }
  }
);

/** GET /api/connections/:eventId/mine — my own lines, for the recap card. */
router.get('/:eventId/mine', requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const connections = await Connection.find({
      eventId,
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
    })
      .populate('userA', 'name headline skills socials avatarUrl')
      .populate('userB', 'name headline skills socials avatarUrl')
      .sort({ createdAt: 1 })
      .lean();

    const people = connections.map((c) => {
      const other = String(c.userA?._id) === String(req.user._id) ? c.userB : c.userA;
      return {
        connectionId: c._id,
        createdAt: c.createdAt,
        note: c.note,
        user: other
          ? {
              id: other._id,
              name: other.name,
              headline: other.headline,
              skills: other.skills,
              socials: other.socials,
              avatarUrl: other.avatarUrl,
            }
          : null,
      };
    });

    return res.json({ count: people.length, connections: people });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /api/connections/:id — private note on a connection you're part of. */
router.patch(
  '/:id',
  requireAuth,
  body('note').isLength({ max: 200 }),
  checkValidation,
  async (req, res, next) => {
    try {
      const connection = await Connection.findById(req.params.id);
      if (!connection) return res.status(404).json({ error: 'No such connection' });

      const isMine =
        String(connection.userA) === String(req.user._id) ||
        String(connection.userB) === String(req.user._id);
      if (!isMine) return res.status(403).json({ error: 'Not your connection' });

      connection.note = req.body.note;
      await connection.save();
      return res.json({ ok: true, note: connection.note });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
