const express = require("express");
const ErrorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Security Configurations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "data:", "blob:"],
      connectSrc: ["'self'", "https://testpodokan.store", "https://*.cloudinary.com", "http://localhost:8000", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "https:", "https://*.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      mediaSrc: ["'self'", "https://*.cloudinary.com"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable compression
app.use(compression());

// Logging in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// CORS Configuration - Simplified and more permissive for troubleshooting
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
  exposedHeaders: ['Authorization', 'Seller-Authorization']
}));

// Remove the additional CORS middleware since we're using the cors package
// Body Parser Configuration
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Combine similar middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 100000 
}));

// API Routes with error catching
const routeHandler = (route) => {
  return async (req, res, next) => {
    try {
      await route(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Import all routes
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

// Mount routes with proper error handling
Object.entries(routes).forEach(([name, router]) => {
  app.use(`/api/v2/${name}`, (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`); // Log incoming requests
    router(req, res, next);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// API Documentation endpoint
app.get('/api/v2', (req, res) => {
  res.json({
    message: 'API is running',
    version: '2.0',
    endpoints: Object.keys(routes).map(route => `/api/v2/${route}`)
  });
});

// 404 Handler - Keep before error handler
app.use((req, res, next) => {
  if (!res.headersSent) {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.originalUrl
    });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Custom Error Handler
app.use(ErrorHandler);

// Global error handlers
const handleFatalError = (error, type) => {
  console.error(`Fatal ${type}:`, error);
  console.error('Stack:', error.stack);
  
  // Give time for logs to be written
  setTimeout(() => {
    process.exit(1);
  }, 1000);
};

process.on("uncaughtException", (err) => handleFatalError(err, 'Uncaught Exception'));
process.on("unhandledRejection", (err) => handleFatalError(err, 'Unhandled Rejection'));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  // Close server, DB connections, etc.
  process.exit(0);
});

module.exports = app;