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
    // Get token from cookie or Authorization header
    const token = 
      req.cookies.token || 
      req.headers.authorization?.split(' ')[1] ||
      req.headers.Authorization?.split(' ')[1];

    console.log('Auth check:', {
      path: req.path,
      token: token ? 'present' : 'missing',
      cookies: req.cookies,
      headers: req.headers
    });

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue"
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({
        success: false,
        message: jwtError.name === 'TokenExpiredError' 
          ? "Session expired. Please login again"
          : "Invalid authentication"
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed"
    });
  }
});


exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    // Check both cookie and header
    const token = 
      req.cookies.seller_token || 
      req.headers["seller-authorization"]?.replace("Bearer ", "") ||
      req.headers["authorization"]?.replace("Bearer ", "");

    console.log('Auth check:', {
      cookies: req.cookies,
      headers: {
        auth: req.headers["authorization"],
        sellerAuth: req.headers["seller-authorization"]
      },
      token: token ? token.substring(0, 20) + '...' : 'missing'
    });

    if (!token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const seller = await Shop.findById(decoded.id);

    if (!seller) {
      return next(new ErrorHandler("Seller not found", 401));
    }

    req.seller = seller;
    next();
  } catch (error) {
    console.error('Auth error:', {
      message: error.message,
      type: error.name,
      stack: error.stack
    });
    return next(new ErrorHandler(error.message || "Authentication failed", 401));
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