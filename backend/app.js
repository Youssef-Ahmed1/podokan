const express = require("express");
const ErrorHandler = require("./utils/ErrorHandler");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require('helmet');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const User = require('./model/user');
const Shop = require('./model/shop');

const app = express();

// Essential middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "https://testpodokan.store", "https://www.testpodokan.store", "http://localhost:3000"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            fontSrc: ["'self'", "https:", "data:"],
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = ['https://testpodokan.store', 'https://www.testpodokan.store', 'http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Seller-Authorization'],
    exposedHeaders: ['Seller-Authorization'],
    maxAge: 86400
};

app.use(cors(corsOptions));

// Add headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, Seller-Authorization');
    next();
});

// Token verification middleware with better error handling
app.use(async (req, res, next) => {
    try {
        // User token verification
        const userToken = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
        if (userToken) {
            try {
                const decoded = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
                req.user = await User.findById(decoded.id).select('-password');
            } catch (error) {
                console.log('User token verification failed:', error.message);
            }
        }

        // Seller token verification
        const sellerToken = req.cookies?.seller_token || req.headers['seller-authorization']?.replace('Bearer ', '');
        if (sellerToken) {
            try {
                const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET_KEY);
                req.seller = await Shop.findById(decoded.id).select('-password');
            } catch (error) {
                console.log('Seller token verification failed:', error.message);
            }
        }
        next();
    } catch (error) {
        console.log('Token verification error:', error);
        next();
    }
});

// API routes
const API_BASE = '/api/v2';

// Route handlers
app.use(`${API_BASE}/user`, require("./controller/user"));
app.use(`${API_BASE}/shop`, require("./controller/shop"));
app.use(`${API_BASE}/product`, require("./controller/product"));
app.use(`${API_BASE}/event`, require("./controller/event"));
app.use(`${API_BASE}/coupon`, require("./controller/coupounCode"));
app.use(`${API_BASE}/payment`, require("./controller/payment"));
app.use(`${API_BASE}/order`, require("./controller/order"));
app.use(`${API_BASE}/conversation`, require("./controller/conversation"));
app.use(`${API_BASE}/message`, require("./controller/message"));
app.use(`${API_BASE}/withdraw`, require("./controller/withdraw"));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path
    });

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
        return res.status(504).json({
            success: false,
            message: 'Request timeout'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'PRODUCTION' 
            ? 'Internal server error' 
            : err.message
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

module.exports = app;