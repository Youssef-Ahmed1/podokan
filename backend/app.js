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

// Import all routes
const userRouter = require("./controller/user");
const shopRouter = require("./controller/shop");
const productRouter = require("./controller/product");
const eventRouter = require("./controller/event");
const couponRouter = require("./controller/coupounCode");
const paymentRouter = require("./controller/payment");
const orderRouter = require("./controller/order");
const conversationRouter = require("./controller/conversation");
const messageRouter = require("./controller/message");
const withdrawRouter = require("./controller/withdraw");

// Security Configurations
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// CORS Configuration
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

// Mount API routes
app.use("/api/v2/user", userRouter);
app.use("/api/v2/shop", shopRouter);
app.use("/api/v2/product", productRouter);
app.use("/api/v2/event", eventRouter);
app.use("/api/v2/coupon", couponRouter);
app.use("/api/v2/payment", paymentRouter);
app.use("/api/v2/order", orderRouter);
app.use("/api/v2/conversation", conversationRouter);
app.use("/api/v2/message", messageRouter);
app.use("/api/v2/withdraw", withdrawRouter);

// API Documentation
app.get('/api/v2', (req, res) => {
  res.json({
    status: 'active',
    version: '2.0',
    endpoints: [
      { path: '/api/v2/user', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/v2/shop', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/v2/product', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/v2/event', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/v2/coupon', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/v2/payment', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/v2/order', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/v2/conversation', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/v2/message', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/api/v2/withdraw', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
    ]
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

// Error Handling Middleware
app.use((err, req, res, next) => {
  if (err instanceof ErrorHandler) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  console.error('Error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Handle Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.error('Uncaught Exception:', err);
  // Perform cleanup if needed
  process.exit(1);
});

// Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error('Unhandled Rejection:', err);
  // Perform cleanup if needed
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  // Perform cleanup if needed
  process.exit(0);
});

module.exports = app;