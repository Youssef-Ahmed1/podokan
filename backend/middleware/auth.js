const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = 
      req.cookies.seller_token ||
      req.headers["seller-authorization"]?.replace("Bearer ", "") ||
      req.body.token;

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
    console.error("Auth middleware error:", error);
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = 
    req.cookies.token ||
    req.headers.authorization?.replace("Bearer ", "") ||
    req.body.token;

  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

// In your auth.js middleware file
exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }
  next();
});
module.exports = exports;