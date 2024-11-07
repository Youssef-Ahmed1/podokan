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
    // Debug log the incoming request
    console.log('Seller Auth Debug:', {
      cookies: req.cookies,
      headers: {
        auth: req.headers.authorization,
        sellerAuth: req.headers['seller-authorization']
      }
    });

    const token = 
      req.headers['seller-authorization']?.replace('Bearer ', '') ||
      req.cookies.seller_token;

    if (!token) {
      return next(new ErrorHandler("Please login as seller to continue", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      console.error('Token verification failed:', err);
      return next(new ErrorHandler("Invalid seller token", 401));
    }

    // Add debug log for decoded token
    console.log('Decoded seller token:', {
      id: decoded.id,
      exp: new Date(decoded.exp * 1000)
    });

    const seller = await Shop.findById(decoded.id);
    
    if (!seller) {
      console.error('Seller not found for ID:', decoded.id);
      return next(new ErrorHandler("Seller not found", 401));
    }

    // Add the seller to the request object
    req.seller = seller;
    next();
  } catch (error) {
    console.error('Seller auth error:', {
      message: error.message,
      type: error.name,
      stack: error.stack
    });
    return next(new ErrorHandler("Authentication failed", 401));
  }
});


exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
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

    try {
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
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Token expired, please login again"
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
});

exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Please login first"
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only."
    });
  }

  next();
});
module.exports = exports;