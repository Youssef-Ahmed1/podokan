const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const User = require("../model/user");

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = 
      req.cookies.seller_token ||
      (req.headers["seller-authorization"] ? req.headers["seller-authorization"].replace("Bearer ", "") : null);

    if (!token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    if (!decoded) {
      return next(new ErrorHandler("Invalid token", 401));
    }

    req.seller = await Shop.findById(decoded.id);

    if (!req.seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    next();
  } catch (error) {
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = 
      req.cookies.token ||
      (req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : null);

    if (!token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

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

exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "Admin") {
      return next(new ErrorHandler("Access denied. Admin only.", 403));
    }
    next();
  } catch (error) {
    return next(new ErrorHandler("Admin authentication failed", 403));
  }
});

module.exports = exports;