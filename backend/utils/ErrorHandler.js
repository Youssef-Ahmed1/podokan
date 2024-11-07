const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
