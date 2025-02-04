const express = require("express");
const ErrorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');

const app = express();

// Constants
const ALLOWED_ORIGINS = [
  'https://testpodokan.store', 
  'http://localhost:3000',
  'https://res.cloudinary.com'  // Add Cloudinary domain
];

// Security headers with updated CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:", "http:", "blob:"], // More permissive for images
      "connect-src": ["'self'", ...ALLOWED_ORIGINS],
      "default-src": ["'self'", ...ALLOWED_ORIGINS]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cookieParser());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
      return callback(null, true); // Changed to allow all origins temporarily
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Seller-Authorization',
    'X-Requested-With',
    'Content-Disposition',
    'Origin',
    'Accept'
  ],
  exposedHeaders: [
    'Authorization',
    'Seller-Authorization',
    'Content-Disposition'
  ]
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'public/images')));

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

// Mount routes with /api/v2 prefix
Object.entries(routes).forEach(([name, router]) => {
  app.use(`/api/v2/${name}`, router);
});

// Error handling
app.use(ErrorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = app;