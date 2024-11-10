const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    headers: req.headers,
    cookies: req.cookies,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// Error handling for body parsing
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(bodyParser.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

app.use(cookieParser());

// Environment config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = ['https://testpodokan.store', 'http://localhost:3000'];
    callback(null, allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Seller-Authorization'
  ],
  exposedHeaders: ['Authorization', 'Seller-Authorization']
}));

// Token handling middleware
app.use((req, res, next) => {
  try {
    const token = req.cookies.token || 
      (req.headers.authorization?.startsWith('Bearer ') ? 
        req.headers.authorization.split(' ')[1] : null);
        
    const sellerToken = req.cookies.seller_token || 
      (req.headers['seller-authorization']?.startsWith('Bearer ') ? 
        req.headers['seller-authorization'].split(' ')[1] : null);

    if (token) req.headers.authorization = `Bearer ${token}`;
    if (sellerToken) req.headers['seller-authorization'] = `Bearer ${sellerToken}`;

    next();
  } catch (error) {
    console.error('Token middleware error:', error);
    next();
  }
});

// Routes
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

// Mount routes
Object.entries(routes).forEach(([name, router]) => {
  app.use(`/api/v2/${name}`, router);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    headers: req.headers,
    cookies: req.cookies
  });

  // Handle specific errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;