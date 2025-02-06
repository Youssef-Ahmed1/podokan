const express = require("express");
const ErrorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require('helmet');

const app = express();

// Constants
const ALLOWED_ORIGINS = [
  'https://testpodokan.store', 
  'http://localhost:3000'
];

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
      "connect-src": ["'self'", ...ALLOWED_ORIGINS, "https://res.cloudinary.com"],
      "default-src": ["'self'", ...ALLOWED_ORIGINS]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Express');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

// Add this to your CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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
    'Accept',
    'Cache-Control',
    'Last-Event-ID'
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