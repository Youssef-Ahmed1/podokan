// middleware/auth.js
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

// User authentication middleware
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
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
  const token = req.cookies.seller_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new ErrorHandler("Please login as seller", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.seller = await Shop.findById(decoded.id);

    if (!req.seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    next();
  } catch (error) {
    return next(new ErrorHandler("Seller authentication failed", 401));
  }
});

// Admin middleware
exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'Admin') {
      return next(new ErrorHandler("Only admin can access this resource", 403));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler("Admin authentication failed", 401));
  }
});

module.exports = exports;