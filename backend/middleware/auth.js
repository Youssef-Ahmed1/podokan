// middleware/auth.js

const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const User = require("../model/user");

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ErrorHandler('Token has expired', 401);
    }
    throw new ErrorHandler('Invalid token', 401);
  }
};


exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = req.cookies.token || 
                 req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to access this resource"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    // Check authorization in correct order
    const token = 
      req.headers["seller-authorization"]?.replace("Bearer ", "") ||
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.seller_token;

    if (!token) {
      console.log('No seller token found:', {
        cookies: req.cookies,
        headers: req.headers
      });
      return next(new ErrorHandler("Please login to continue", 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const seller = await Shop.findById(decoded.id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 401));
      }

      req.seller = seller;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new ErrorHandler("Token expired, please login again", 401));
      }
      throw error;
    }
  } catch (error) {
    console.error('Seller auth error:', {
      message: error.message,
      type: error.name,
      stack: error.stack
    });
    return next(new ErrorHandler("Authentication failed", 401));
  }
});


exports.isAdmin = (adminType = "Admin") => catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    if (req.user.role !== adminType) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${adminType} only.`
      });
    }

    // Add caching headers
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed"
    });
  }
});

module.exports = exports;