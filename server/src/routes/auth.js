import { Router } from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';
import { checkValidation } from '../middleware/error.js';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  checkValidation,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'That email is already registered' });

      const user = new User({ name, email });
      await user.setPassword(password);
      await user.save();

      return res.status(201).json({ token: signToken(user._id), user: user.toPublic() });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  checkValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) return res.status(401).json({ error: 'Email or password is incorrect' });

      const ok = await user.verifyPassword(password);
      if (!ok) return res.status(401).json({ error: 'Email or password is incorrect' });

      return res.json({ token: signToken(user._id), user: user.toPublic() });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

export default router;
