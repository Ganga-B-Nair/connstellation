import { validationResult } from 'express-validator';

/** Turns express-validator results into a 422. Use after a validation chain. */
export function checkValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return res.status(422).json({
    error: 'Validation failed',
    details: result.array().map((e) => ({ field: e.path, message: e.msg })),
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  if (err.code === 11000) {
    return res.status(409).json({ error: 'That already exists', keys: err.keyValue });
  }
  if (err.name === 'ValidationError') {
    return res.status(422).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Malformed id: ${err.value}` });
  }

  return res.status(err.status || 500).json({ error: err.message || 'Server error' });
}
