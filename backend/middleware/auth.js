const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
const expressRateLimit = require('express-rate-limit'); // Add this import

// Token extractors
const extractToken = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
        return req.cookies?.token;
    } catch (error) {
        console.error('Token extraction error:', error);
        return null;
    }
};

const extractSellerToken = (req) => {
    try {
        const authHeader = req.headers['seller-authorization'];
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
        return req.cookies?.seller_token;
    } catch (error) {
        console.error('Seller token extraction error:', error);
        return null;
    }
};

// Rate limiting middleware
const expressRateLimit = require('express-rate-limit'); // Make sure this is properly imported

exports.apiLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Authentication middleware
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please login to access this resource"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decoded.id).select("+role");

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
    const token = extractSellerToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please login as seller"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
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
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Seller token expired, please login again"
            });
        }
        return res.status(401).json({
            success: false,
            message: "Seller authentication failed"
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

    if (req.user.role !== "Admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied: Admin only"
        });
    }

    next();
});

module.exports = exports;