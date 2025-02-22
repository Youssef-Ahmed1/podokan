// middleware/error.js
const ErrorHandler = require("../utils/ErrorHandler");

module.exports = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Set default error values
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Handle specific error types
  switch (err.name) {
    case "CastError":
      err = new ErrorHandler(`Resource not found. Invalid: ${err.path}`, 400);
      break;

    case "ValidationError":
      const messages = Object.values(err.errors).map(val => val.message);
      err = new ErrorHandler(messages.join('. '), 400);
      break;

    case "JsonWebTokenError":
      err = new ErrorHandler("Invalid token. Please login again", 401);
      break;

    case "TokenExpiredError":
      err = new ErrorHandler("Token expired. Please login again", 401);
      break;
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new ErrorHandler(`${field} already exists`, 400);
  }

  // Send error response
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && {
      error: err.stack,
      path: req.path
    })
  });
};