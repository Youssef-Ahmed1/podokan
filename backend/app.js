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
const corsOptions = {
  origin: process.env.NODE_ENV === 'PRODUCTION' 
    ? ['https://testpodokan.store']
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Seller-Authorization'],
  exposedHeaders: ['Authorization', 'Seller-Authorization']
};

app.use(cors(corsOptions));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://testpodokan.store', 'https://res.cloudinary.com'],
      imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
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

// Mount API routes - FIXED VERSION
Object.entries(routes).forEach(([name, router]) => {
  if (typeof router === 'function') {
    // If router is a middleware function, use it directly
    app.use(`/api/v2/${name}`, router);
  } else if (router.router && typeof router.router.use === 'function') {
    // If router has a router property (Express Router instance)
    app.use(`/api/v2/${name}`, router.router);
  } else {
    console.warn(`Warning: Invalid router for ${name}`);
  }
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