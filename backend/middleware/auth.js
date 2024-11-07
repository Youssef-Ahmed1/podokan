// middleware/auth.js

const jwt = require("jsonwebtoken");
const Shop = require("../model/shop");
const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");

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

const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from headers or cookies
    const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to access this resource"
      });
    }

    // Verify token
    const decoded = verifyToken(token, process.env.JWT_SECRET_KEY);
    
    // Get user
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
      message: error.message || "Authentication failed"
    });
  }
};

const isSeller = async (req, res, next) => {
  try {
    const token = req.cookies?.seller_token || 
                 req.headers?.['seller-authorization']?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login as seller"
      });
    }

    const decoded = verifyToken(token, process.env.JWT_SECRET_KEY);
    const seller = await Shop.findById(decoded.id);

    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "Seller not found"
      });
    }

    req.seller = seller;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Seller authentication failed"
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Admin access denied"
    });
  }
};

module.exports = {
  isAuthenticated,
  isSeller,
  isAdmin,
  verifyToken  // Export for testing
};