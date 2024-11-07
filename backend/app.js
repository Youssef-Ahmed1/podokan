const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const ErrorHandler = require("./middleware/error");

const app = express();

// Trust proxy - Add this before other middleware
app.set('trust proxy', 1);

// Load environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'https://testpodokan.store'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Seller-Authorization',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  exposedHeaders: ['Authorization', 'Seller-Authorization']
};

app.use(cors(corsOptions));

// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Expose-Headers', 'Authorization, Seller-Authorization');
  next();
});

// Essential middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Request logging in development
if (process.env.NODE_ENV !== "PRODUCTION") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()}: ${req.method} ${req.url}`);
    next();
  });
}

// Import routes
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const conversation = require("./controller/conversation");
const message = require("./controller/message");
const withdraw = require("./controller/withdraw");

// API Routes with prefix
const API_PREFIX = "/api/v2";

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use(`${API_PREFIX}/user`, user);
app.use(`${API_PREFIX}/shop`, shop);
app.use(`${API_PREFIX}/product`, product);
app.use(`${API_PREFIX}/event`, event);
app.use(`${API_PREFIX}/coupon`, coupon);
app.use(`${API_PREFIX}/payment`, payment);
app.use(`${API_PREFIX}/order`, order);
app.use(`${API_PREFIX}/conversation`, conversation);
app.use(`${API_PREFIX}/message`, message);
app.use(`${API_PREFIX}/withdraw`, withdraw);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error [${req.method} ${req.url}]:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
  next(err);
});

// Final error handler
app.use(ErrorHandler);

module.exports = app;