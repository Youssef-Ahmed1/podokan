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
  contentSecurityPolicy: false, // Temporarily disable CSP for debugging
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// CORS Configuration - More permissive for debugging
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*']
}));

// Body Parser Configuration
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API Routes with error handling wrapper
const asyncHandler = fn => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
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

// Mount API routes
Object.entries(routes).forEach(([name, router]) => {
  app.use(`/api/v2/${name}`, asyncHandler(async (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    await Promise.resolve(router(req, res, next));
  }));
});

// API Documentation
app.get('/api/v2', (req, res) => {
  res.json({
    status: 'active',
    version: '2.0',
    endpoints: Object.keys(routes).map(route => ({
      path: `/api/v2/${route}`,
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }))
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error Handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  process.exit(0);
});

module.exports = app;