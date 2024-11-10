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
  origin: function(origin, callback) {
    callback(null, origin);
  },
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, Seller-Authorization');
  next();
});

// Authentication middleware
app.use((req, res, next) => {
  const token = req.cookies.token || 
    (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
    
  const sellerToken = req.cookies.seller_token || 
    (req.headers['seller-authorization'] && req.headers['seller-authorization'].replace('Bearer ', ''));

  // Set clean headers for downstream middleware
  if (token) {
    req.headers.authorization = `Bearer ${token}`;
  }
  if (sellerToken) {
    req.headers['seller-authorization'] = `Bearer ${sellerToken}`;
  }

  next();
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

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: "Invalid token or no token provided"
    });
  }

  console.error('Error:', {
    path: req.path,
    method: req.method,
    error: err.message,
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

module.exports = app;