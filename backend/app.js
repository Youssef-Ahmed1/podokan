const express = require("express");
const ErrorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');

// Initialize express
const app = express();

// Essential middleware with optimized settings
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Load environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// CORS configuration
const corsOptions = {
  origin: ['https://testpodokan.store', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Seller-Authorization',
    'x-requested-with'
  ],
  exposedHeaders: ['Authorization', 'Seller-Authorization']
};

app.use(cors(corsOptions));

// Cookie settings
const cookieConfig = {
  secure: process.env.NODE_ENV === 'PRODUCTION',
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'PRODUCTION' ? 'strict' : 'lax',
  domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined,
  path: '/'
};

// Token extraction middleware
app.use((req, res, next) => {
  // Extract tokens
  const token = req.cookies.token || 
                (req.headers.authorization?.startsWith('Bearer') ? 
                 req.headers.authorization.split(' ')[1] : null);
                 
  const sellerToken = req.cookies.seller_token || 
                     (req.headers['seller-authorization']?.startsWith('Bearer') ? 
                      req.headers['seller-authorization'].split(' ')[1] : null);

  // Set tokens in headers
  if (token) req.headers.authorization = `Bearer ${token}`;
  if (sellerToken) req.headers['seller-authorization'] = `Bearer ${sellerToken}`;

  // Override res.cookie to always use secure settings
  const originalCookie = res.cookie;
  res.cookie = function(name, value, options = {}) {
    return originalCookie.call(this, name, value, { ...cookieConfig, ...options });
  };

  next();
});

// Import routes
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

// API Routes with prefix
const API_PREFIX = "/api/v2";
Object.entries(routes).forEach(([name, router]) => {
  app.use(`${API_PREFIX}/${name}`, router);
});

// Global error handling
app.use((err, req, res, next) => {
  console.error('Error:', {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle specific errors
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
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
    message: 'Route not found'
  });
});

// Error handling for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;