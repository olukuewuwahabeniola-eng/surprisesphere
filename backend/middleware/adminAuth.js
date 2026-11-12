import { AppError } from '../utils/AppError.js';

export function requireAdmin(req, _res, next) {
  const configured = String(process.env.ADMIN_KEY || '').trim();
  if (!configured) {
    next(new AppError('Admin access is not configured on the server yet.', 503));
    return;
  }

  const provided = String(req.headers['x-admin-key'] || req.body?.adminKey || '').trim();
  if (!provided || provided !== configured) {
    next(new AppError('Admin key is invalid.', 401));
    return;
  }

  next();
}
