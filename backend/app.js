const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Essential middleware
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Environment config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// CORS configuration
app.use(cors({
  origin: ['https://testpodokan.store', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Seller-Authorization',
    'x-requested-with'
  ]
}));

// Authentication middleware
app.use((req, res, next) => {
  try {
    // Extract tokens from cookies and headers
    const authToken = req.cookies.token || 
      (req.headers.authorization?.startsWith('Bearer ') ? 
        req.headers.authorization.slice(7) : null);

    const sellerToken = req.cookies.seller_token || 
      (req.headers['seller-authorization']?.startsWith('Bearer ') ? 
        req.headers['seller-authorization'].slice(7) : null);

    // Set clean headers
    if (authToken) {
      req.headers.authorization = `Bearer ${authToken}`;
    }
    if (sellerToken) {
      req.headers['seller-authorization'] = `Bearer ${sellerToken}`;
    }

    // Cookie settings for responses
    res.cookie = (name, value, options = {}) => {
      const defaultOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'PRODUCTION',
        sameSite: 'strict',
        domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined,
        path: '/'
      };
      return express.response.cookie.call(res, name, value, { ...defaultOptions, ...options });
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
});

// Routes
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

// API Routes
app.use("/api/v2/user", user);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/order", order);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/withdraw", withdraw);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle specific errors
  if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: "Request entity too large"
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// Handle unhandled routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

module.exports = app;