const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const ErrorHandler = require("./middleware/error");

const app = express();

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:3000', 'https://testpodokan.store'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Seller-Authorization',
    'X-Requested-With'
  ],
  exposedHeaders: ['Authorization', 'Seller-Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Request parsing middleware
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(cookieParser());
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

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// Request logging with error handling
app.use((req, res, next) => {
  const start = Date.now();
  const cleanup = () => {
    res.removeListener('finish', logRequest);
    res.removeListener('error', logError);
    res.removeListener('close', cleanup);
  };

  const logRequest = () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      query: req.query,
      auth: {
        token: req.cookies?.token ? 'present' : 'missing',
        sellerToken: req.cookies?.seller_token ? 'present' : 'missing'
      }
    });
    cleanup();
  };

  const logError = (error) => {
    console.error(`[${new Date().toISOString()}] Request Error:`, {
      method: req.method,
      path: req.path,
      error: error.message
    });
    cleanup();
  };

  res.on('finish', logRequest);
  res.on('error', logError);
  res.on('close', cleanup);
  next();
});

// Request timeout with cleanup
app.use((req, res, next) => {
  const timeout = 30000;
  req.setTimeout(timeout, () => {
    console.error(`Request timeout after ${timeout}ms:`, {
      method: req.method,
      path: req.path
    });
  });
  
  res.setTimeout(timeout, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: "Request timeout - operation took too long"
      });
    }
  });
  next();
});

// API Routes with prefix
const API_PREFIX = "/api/v2";
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

// Mount routes with error handling
Object.entries(routes).forEach(([name, router]) => {
  app.use(`${API_PREFIX}/${name}`, (req, res, next) => {
    Promise.resolve(router(req, res, next)).catch(next);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Handle specific errors
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format'
    });
  }

  if (err.name === 'PayloadTooLargeError') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }

  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(503).json({
      success: false,
      message: 'Database operation failed'
    });
  }

  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    return res.status(504).json({
      success: false,
      message: 'Request timeout'
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      path: req.path,
      method: req.method 
    })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Export app
module.exports = app;