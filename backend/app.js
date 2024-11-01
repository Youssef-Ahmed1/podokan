const express = require("express");
const ErrorHandler = require("./utils/ErrorHandler");
const errorMiddleware = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const emailService = require('./utils/sendMail');  
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const { isAuthenticated, isSeller } = require('./middleware/auth');
const User = require('./model/user');
const Shop = require('./model/shop');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: ['https://testpodokan.store', 'https://www.testpodokan.store', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

// Trust proxy
app.set('trust proxy', 1);

// Token verification middleware
app.use(async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    const sellerToken = req.cookies.seller_token || req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        console.error('User token verification failed:', error.message);
      }
    }

    if (sellerToken) {
      try {
        const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET_KEY);
        req.seller = await Shop.findById(decoded.id).select('-password');
      } catch (error) {
        console.error('Seller token verification failed:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    next();
  }
});

// Middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

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
app.use(errorMiddleware);

module.exports = app;