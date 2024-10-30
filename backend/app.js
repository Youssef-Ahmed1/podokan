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

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: [
    'https://testpodokan.store',
    'https://www.testpodokan.store',
    ...(process.env.NODE_ENV !== 'PRODUCTION' ? ['http://localhost:3000'] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Set-Cookie', 'Date', 'ETag'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Additional headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false
});

// API rate limiter
app.use('/api/', createRateLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests, please try again later.'
));

// Middleware
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`, {
    headers: req.headers,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 2048 * 2048,
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) return cb(null, true);
    cb(new ErrorHandler("Only images (jpeg, jpg, png, gif) are allowed", 400));
  }
}).array('files', 5);

// Handle file upload errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return next(new ErrorHandler(err.message, 400));
  }
  next(err);
});

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'PODokan Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Email test endpoint
app.get('/test-email', createRateLimiter(
  60 * 60 * 1000,
  5,
  'Too many email test requests'
), async (req, res, next) => {
  try {
    await emailService({
      email: 'moropass1212@gmail.com',
      subject: 'PODokan Test Email',
      html: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #4e64df;">PODokan Test Email</h2>
          <p>This is a test email sent at: ${new Date().toLocaleString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
        </div>
      `
    });
    
    res.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

const API_BASE = '/api/v2';

// Mount routes with validation and logging
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

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params
  });
  next();
});

// CORS middleware update
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 404 Handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl.replace(API_BASE, '')
  });
});

// Error handling middleware
app.use(errorMiddleware);

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

module.exports = app;

