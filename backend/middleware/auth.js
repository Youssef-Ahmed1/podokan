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
    const token = req.cookies.token || 
                 req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // Get user with essential fields only
    const user = await User.findById(decoded.id)
      .select('name email role status')
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or deactivated"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 
        'Session expired. Please login again.' : 
        'Authentication failed'
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

exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    // Check if req.user exists before accessing properties
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
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