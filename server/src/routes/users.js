import { Router } from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { checkValidation } from '../middleware/error.js';

const router = Router();

// GET /api/users/:id — public profile card
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'No such user' });
    return res.json({ user: user.toPublic() });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/users/me — edit your own profile
router.patch(
  '/me',
  requireAuth,
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('bio').optional().isLength({ max: 280 }),
  body('headline').optional().isLength({ max: 80 }),
  body('skills').optional().isArray({ max: 12 }).withMessage('Up to 12 skills'),
  body('interests').optional().isArray({ max: 12 }),
  checkValidation,
  async (req, res, next) => {
    try {
      const allowed = ['name', 'bio', 'headline', 'skills', 'interests', 'avatarUrl'];
      for (const key of allowed) {
        if (req.body[key] !== undefined) req.user[key] = req.body[key];
      }
      if (req.body.socials) {
        req.user.socials = { ...req.user.socials.toObject?.() ?? req.user.socials, ...req.body.socials };
      }
      await req.user.save();
      return res.json({ user: req.user.toPublic() });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
