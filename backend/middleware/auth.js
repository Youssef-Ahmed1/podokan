const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

// Utility functions
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return req.cookies.token;
};

const extractSellerToken = (req) => {
    const authHeader = req.headers['seller-authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return req.cookies.seller_token;
};

const verifyToken = async (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new ErrorHandler(
            error.name === 'TokenExpiredError' 
                ? 'Token has expired' 
                : 'Invalid token',
            401
        );
    }
};

// Middleware
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return next(new ErrorHandler("Please login to access this resource", 401));
    }

    try {
        const decodedData = await verifyToken(token, process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decodedData.id).select("+role");

        if (!req.user) {
            return next(new ErrorHandler("User not found", 401));
        }

        next();
    } catch (error) {
        next(error);
    }
});

exports.isSeller = catchAsyncErrors(async (req, res, next) => {
    const token = extractSellerToken(req);

    if (!token) {
        return next(new ErrorHandler("Please login as seller to access this resource", 401));
    }

    try {
        const decodedData = await verifyToken(token, process.env.JWT_SECRET_KEY);
        req.seller = await Shop.findById(decodedData.id);

        if (!req.seller) {
            return next(new ErrorHandler("Seller not found", 401));
        }

        next();
    } catch (error) {
        next(error);
    }
});

exports.isAdmin = catchAsyncErrors(async (req, res, next) => {
    if (!req.user) {
        return next(new ErrorHandler("Please login first", 401));
    }

    if (req.user.role !== "Admin") {
        return next(new ErrorHandler("Access denied: Admin only", 403));
    }

    next();
});

// Role-based authorization
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(
                `Role (${req.user.role}) is not allowed to access this resource`,
                403
            ));
        }
        next();
    };
};

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Request validation middleware
exports.validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return next(new ErrorHandler(errorMessage, 400));
        }
        next();
    };
};

// Security middleware
exports.securityHeaders = (req, res, next) => {
    // CORS headers
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    
    // Security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    next();
};

// Error logging middleware
exports.errorLogger = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        user: req.user ? req.user.id : 'unauthenticated'
    });
    next(err);
};