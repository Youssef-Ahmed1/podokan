const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const emailService = require('./utils/sendMail');  
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie', 'Date', 'ETag'],
  maxAge: 86400
};

app.use(cors(corsOptions));

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
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
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
    cb(new Error("Only images (jpeg, jpg, png, gif) are allowed"));
  }
}).array('files', 5);

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
), async (req, res) => {
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
    console.error('Test email failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Route definitions
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

// Mount routes with validation
for (const [name, handler] of Object.entries(routes)) {
  if (!handler || typeof handler.use !== 'function') {
    console.error(`Invalid router for ${name}`);
    continue;
  }
  app.use(`/api/v2/${name}`, handler);
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Enhanced Error Handler
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Define error types and their handlers
  const errorTypes = {
    PayloadTooLargeError: () => ({
      status: 413,
      message: 'File size exceeds the limit (100MB)'
    }),
    ValidationError: () => ({
      status: 400,
      message: 'Validation Error',
      errors: Object.values(err.errors || {}).map(e => e.message)
    }),
    MulterError: () => ({
      status: 400,
      message: 'File upload error',
      error: err.message
    }),
    TypeError: () => ({
      status: 400,
      message: err.message || 'Invalid input type'
    }),
    JsonWebTokenError: () => ({
      status: 401,
      message: 'Invalid token'
    }),
    TokenExpiredError: () => ({
      status: 401,
      message: 'Token expired'
    }),
    MongooseError: () => ({
      status: 500,
      message: 'Database error'
    }),
    CastError: () => ({
      status: 400,
      message: 'Invalid ID format'
    })
  };

  const handler = errorTypes[err.name];
  if (handler) {
    const { status, ...response } = handler();
    return res.status(status).json({
      success: false,
      ...response
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;