import mongoose from 'mongoose';

export function errorHandler(err, req, res, next) {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Something went wrong. Please try again.';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {})
      .map((entry) => entry.message)
      .join(' ') || 'Validation failed.';
  } else if (err.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyPattern || {});
    message = fields.length
      ? `A record with that ${fields.join(', ')} already exists.`
      : 'A duplicate record already exists.';
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `That ${err.path || 'value'} is not valid.`;
  }

  if (status >= 500) {
    console.error(err);
  }

  if (res.headersSent) {
    next(err);
    return;
  }

  const payload = {
    message:
      status >= 500 && process.env.NODE_ENV === 'production'
        ? 'Something went wrong. Please try again.'
        : message,
  };

  if (err.details && status < 500) {
    payload.details = err.details;
  }

  res.status(status).json(payload);
}
