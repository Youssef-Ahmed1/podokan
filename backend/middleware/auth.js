const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const User = require("../model/user");

const verifyToken = async (token, secretKey) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    return null;
  }
};

const checkAndRefreshAuth = async () => {
  try {
    const response = await fetch('/api/v2/user/getuser', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Important for cookies
    });

    if (!response.ok) {
      throw new Error('Auth check failed');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
};
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = 
      req.cookies.token ||
      (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);

    if (!token) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select('-password').lean();

    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    // Clear invalid token
    res.cookie('token', '', { 
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });

    if (error.name === 'JsonWebTokenError') {
      return next(new ErrorHandler("Invalid token, please login again", 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler("Token expired, please login again", 401));
    }
    return next(new ErrorHandler("Authentication failed", 401));
  }
});


exports.isSeller = catchAsyncErrors(async (req, res, next) => {
  try {
    const token = 
      req.cookies.seller_token ||
      (req.headers['seller-authorization'] ? req.headers['seller-authorization'].replace('Bearer ', '') : null);

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
    console.error('Seller auth error:', error);
    return next(new ErrorHandler("Authentication failed", 401));
  }
});




// Change back to the original format
exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }
  next();
});

module.exports = exports;