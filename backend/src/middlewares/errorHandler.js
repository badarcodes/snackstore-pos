/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('⚠️ Global Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server internal.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

module.exports = errorHandler;
