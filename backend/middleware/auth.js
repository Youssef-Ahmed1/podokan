// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
const ErrorHandler = require("../utils/ErrorHandler");


// middleware/auth.js - Update the token extraction
exports.isAuthenticated = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // Fallback to cookies if no Authorization header
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new ErrorHandler("Please login to access this resource", 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      
      if (!decoded.id) {
        return next(new ErrorHandler("Invalid token format", 401));
      }

      const user = await User.findById(decoded.id)
        .select('-password')
        .lean();

      if (!user) {
        return next(new ErrorHandler("User not found", 401));
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new ErrorHandler("Invalid token", 401));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new ErrorHandler("Token expired", 401));
      }
      throw error;
    }
  } catch (error) {
    console.error("Auth error:", error);
    return next(new ErrorHandler("Authentication failed", 500));
  }
};


exports.isSeller = async (req, res, next) => {
  try {
    let token;
    
    // Check seller-specific Authorization header
    const authHeader = req.headers['seller-authorization'] || req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // Fallback to seller_token cookie
    else if (req.cookies && req.cookies.seller_token) {
      token = req.cookies.seller_token;
    }

    if (!token) {
      return next(new ErrorHandler("Please login as seller to continue", 401));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      
      if (!decoded.id) {
        return next(new ErrorHandler("Invalid seller token format", 401));
      }

      const seller = await Shop.findById(decoded.id)
        .select('-password')
        .lean();

      if (!seller) {
        return next(new ErrorHandler("Seller not found", 401));
      }

      if (!seller.isVerified) {
        return next(new ErrorHandler("Seller account is not verified", 403));
      }

      req.seller = seller;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new ErrorHandler("Invalid seller token", 401));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new ErrorHandler("Seller token expired", 401));
      }
      throw error;
    }
  } catch (error) {
    console.error("Seller auth error:", error);
    return next(new ErrorHandler("Seller authentication failed", 500));
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ErrorHandler("Please login first", 401));
    }

    // Check for both lowercase and uppercase "admin" role
    const isAdminUser = req.user.role?.toLowerCase() === 'admin';
    
    if (!isAdminUser) {
      return next(new ErrorHandler("Access denied: Admin only", 403));
    }

    // Add admin check timestamp for debugging
    req.adminCheckTimestamp = new Date().toISOString();
    
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return next(new ErrorHandler("Admin authorization failed", 500));
  }
};



// Utility function to validate JWT token
const validateToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error("Token validation error:", error);
    return null;
  }
};

// Export utility function if needed elsewhere
exports.validateToken = validateToken;