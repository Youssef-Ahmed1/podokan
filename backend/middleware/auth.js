const jwt = require('jsonwebtoken');
const User = require('../model/user');
const Shop = require('../model/shop');
const ErrorHandler = require('../utils/ErrorHandler');

exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies?.token || 
                 req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to continue"
      });
    }

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
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

exports.isSeller = async (req, res, next) => {
  try {
    const token = req.cookies?.seller_token || 
                 req.headers['seller-authorization']?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login as seller to continue"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const seller = await Shop.findById(decoded.id).select('-password');

    if (!seller) {
      return res.status(401).json({
        success: false,
        message: "Seller not found"
      });
    }

    req.seller = seller;
    next();
  } catch (error) {
    console.error("Seller auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Seller authentication failed"
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Admin authorization failed"
    });
  }
};