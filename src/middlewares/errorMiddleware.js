/**
 * Global Error Handler Middleware
 */
const errorMiddleware = (err, req, res, next) => {
  console.error(`[Error]: ${err.message}`);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorMiddleware;
