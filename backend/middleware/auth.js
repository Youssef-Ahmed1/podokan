// middleware/auth.js
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

// User authentication middleware
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorHandler("User not found", 401));
    }

    next();
  } catch (error) {
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

// Seller authentication middleware
exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  const { seller_token } = req.cookies;

  if (!seller_token) {
    return next(new ErrorHandler("Please login as seller", 401));
  }

  try {
    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);
    req.seller = await Shop.findById(decoded.id);

    if (!req.seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    next();
  } catch (error) {
    return next(new ErrorHandler("Seller authentication failed", 401));
  }
});

// Admin role check middleware
exports.isAdmin = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`, 403)
      );
    }

    next();
  };
};

module.exports = exports;