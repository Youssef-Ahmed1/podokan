const express = require("express");
const ErrorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const helmet = require('helmet'); // Add this package for security headers

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Environment configuration
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "config/.env" });
}

// Constants
const ALLOWED_ORIGINS = ['https://testpodokan.store', 'http://localhost:3000'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif/;

// Cookie configuration
const getCookieOptions = (customOptions = {}) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'PRODUCTION',
  sameSite: process.env.NODE_ENV === 'PRODUCTION' ? 'strict' : 'lax',
  domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined,
  path: '/',
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ...customOptions
});

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Seller-Authorization',
    'X-Requested-With'
  ],
  exposedHeaders: ['Authorization', 'Seller-Authorization'],
  maxAge: 86400 // 24 hours
}));

// Request parsing middleware
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Cookie middleware
app.use((req, res, next) => {
  const originalSetCookie = res.cookie;
  res.cookie = function(name, value, options = {}) {
    return originalSetCookie.call(this, name, value, getCookieOptions(options));
  };
  next();
});

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const isValidType = ALLOWED_IMAGE_TYPES.test(path.extname(file.originalname).toLowerCase()) &&
                       ALLOWED_IMAGE_TYPES.test(file.mimetype);
    if (isValidType) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    ip: req.ip,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} completed in ${duration}ms with status ${res.statusCode}`);
  });

  next();
});

// API Routes
const routes = {
  user: require("./controller/user"),
  shop: require("./controller/shop"),
  product: require("./controller/product"),
  event: require("./controller/event"),
  coupon: require("./controller/coupounCode"),
  payment: require("./controller/payment"),
  order: require("./controller/order"),
  conversation: require("./controller/conversation"),
  message: require("./controller/message"),
  withdraw: require("./controller/withdraw")
};

// Mount routes with API prefix
Object.entries(routes).forEach(([name, router]) => {
  app.use(`/api/v2/${name}`, router);
});

// Request timeout middleware
app.use((req, res, next) => {
  const timeout = 30000; // 30 seconds
  req.setTimeout(timeout, () => {
    const error = new Error('Request timeout');
    error.status = 504;
    next(error);
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: {
      name: err.name,
      message: err.message,
      status: err.status || 500,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });

  // Handle specific errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Generic error response
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Export app
module.exports = app;