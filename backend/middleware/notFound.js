export function notFound(req, res) {
  res.status(404).json({ message: `Nothing is published at ${req.originalUrl}.` });
}
