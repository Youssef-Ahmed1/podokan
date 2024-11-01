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
<<<<<<< HEAD

<<<<<<< HEAD
// Basic middleware
=======
=======
//.
>>>>>>> refs/remotes/origin/main
// Essential middleware
>>>>>>> refs/remotes/origin/main
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
<<<<<<< HEAD
=======
app.use(cookieParser());
>>>>>>> refs/remotes/origin/main

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
<<<<<<< HEAD
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://testpodokan.store',
      'https://www.testpodokan.store',
      'http://localhost:3000'
    ];
    callback(null, true); // Allow all origins temporarily for debugging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
=======
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://testpodokan.store',
            'https://www.testpodokan.store',
            'http://localhost:3000'
        ];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400
};
>>>>>>> refs/remotes/origin/main

// Handle preflight requests
app.options('*', cors());

<<<<<<< HEAD
// Add headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Simplified token verification
app.use((req, res, next) => {
  const verifyToken = async (token, Model) => {
    try {
      if (!token) return null;
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      return await Model.findById(decoded.id).select('-password');
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return null;
    }
  };

  Promise.all([
    verifyToken(req.cookies?.token, User),
    verifyToken(req.cookies?.seller_token, Shop)
  ])
    .then(([user, seller]) => {
      req.user = user;
      req.seller = seller;
      next();
    })
    .catch(error => {
      console.log('Token verification error:', error);
      next();
    });
=======
// Token verification middleware
app.use(async (req, res, next) => {
    try {
        // User token verification
        const userToken = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (userToken) {
            try {
                const decoded = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
                req.user = await User.findById(decoded.id).select('-password');
            } catch (error) {
                console.log('User token verification failed:', error.message);
            }
        }

        // Seller token verification
        const sellerToken = req.cookies?.seller_token || req.headers['seller-authorization']?.split(' ')[1];
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
>>>>>>> refs/remotes/origin/main
});

// API routes
const API_BASE = '/api/v2';

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

// Error handling
app.use((err, req, res, next) => {
<<<<<<< HEAD
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
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
  
  next(err);
=======
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
    
    if (err.name === 'CORSError') {
        return res.status(403).json({
            success: false,
            message: 'CORS error: ' + err.message
        });
    }
    
    next(err);
>>>>>>> refs/remotes/origin/main
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl.replace(API_BASE, '')
    });
});

// Final error handling
app.use(require("./middleware/error"));

module.exports = app;
