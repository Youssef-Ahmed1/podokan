const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const ErrorHandler = require("./middleware/error");

const app = express();

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:3000', 'https://testpodokan.store'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Seller-Authorization'],
  exposedHeaders: ['Authorization', 'Seller-Authorization'],
  maxAge: 86400
}));

// Increased limits for parsing
app.use(express.json({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Add request timeout handler
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: "Request timeout"
      });
    }
  });
  next();
});
// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      query: req.query,
      auth: {
        token: req.cookies?.token ? 'present' : 'missing',
        sellerToken: req.cookies?.seller_token ? 'present' : 'missing'
      }
    });
  });
  next();
});

// Request timeout
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(504).json({
      success: false,
      message: "Request timeout"
    });
  });
  next();
});

// API Routes
const API_PREFIX = "/api/v2";
Object.entries(routes).forEach(([name, router]) => {
  app.use(`${API_PREFIX}/${name}`, (req, res, next) => {
    Promise.resolve(router(req, res, next)).catch(next);
  });
});

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

Object.entries(routes).forEach(([name, router]) => {
  app.use(`${API_PREFIX}/${name}`, router);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = app;
