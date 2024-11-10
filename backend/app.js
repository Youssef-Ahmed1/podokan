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
    const allowedOrigins = ['https://testpodokan.store', 'http://localhost:3000'];
    callback(null, allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Seller-Authorization'],
  exposedHeaders: ['Authorization', 'Seller-Authorization']
}));

// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, Seller-Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Cookie config middleware
app.use((req, res, next) => {
  res.cookie = (name, value, options = {}) => {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'PRODUCTION',
      sameSite: 'strict',
      domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    
    return res.cookie(name, value, { ...defaultOptions, ...options });
  };
  next();
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
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