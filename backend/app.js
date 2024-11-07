const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const appConfig = require('../backend/server');

// CORS configuration
const corsOptions = {
  origin: ['https://testpodokan.store', 'https://www.testpodokan.store'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Seller-Authorization'],
  exposedHeaders: ['Authorization', 'Seller-Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Single cookie configuration middleware
app.use((req, res, next) => {
  const originalCookie = res.cookie;
  res.cookie = function(name, value, options = {}) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.testpodokan.store',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...options
    };
    
    return originalCookie.call(this, name, value, cookieOptions);
  };
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization, Seller-Authorization');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    cookies: req.cookies,
    headers: {
      origin: req.headers.origin,
      authorization: req.headers.authorization ? 'present' : 'missing',
      'seller-authorization': req.headers['seller-authorization'] ? 'present' : 'missing'
    }
  });
  next();
});

// Essential middleware
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(appConfig.fileUploadPath));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Images Only!"));
  },
});

// Create uploads directory
(async () => {
  try {
    await fs.access('uploads');
  } catch {
    await fs.mkdir('uploads', { recursive: true });
  }
})();

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

// API Routes
const API_PREFIX = "/api/v2";

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

// Timeout middleware
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(504).json({
      success: false,
      message: "Request timeout"
    });
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path
  });

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON'
    });
  }

  if (err.name === 'PayloadTooLargeError') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }

  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    return res.status(504).json({
      success: false,
      message: 'Request timeout'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = app;