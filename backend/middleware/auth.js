const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const User = require("../model/user");

// Remove exports. syntax and use const declarations
const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = 
      req.headers.authorization?.replace('Bearer ', '') ||
      req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to access this resource"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select('+role');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' 
        ? "Token expired, please login again"
        : "Authentication failed"
    });
  }
});

const isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = 
      req.headers['seller-authorization']?.replace('Bearer ', '') ||
      req.cookies.seller_token;

    if (!token) {
      return next(new ErrorHandler("Please login as seller to continue", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const seller = await Shop.findById(decoded.id);
    
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    req.seller = seller;
    next();
  } catch (error) {
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

const isAdmin = catchAsyncErrors(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler("Please login first", 401));
  }

  if (req.user.role !== "Admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }

  next();
});

// Single exports at the end
module.exports = {
  isAuthenticated,
  isSeller,
  isAdmin
};