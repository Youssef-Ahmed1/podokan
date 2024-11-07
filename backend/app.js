const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const ErrorHandler = require("./middleware/error");
const path = require("path");

const app = express();

// Load environment variables first
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://testpodokan.store',
      'https://www.testpodokan.store'
    ];
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
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  exposedHeaders: ['Authorization', 'Seller-Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Security Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('Referrer-Policy', 'same-origin');
  next();
});

// Body Parser Configuration
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

// Request Logger
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip;

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  if (process.env.NODE_ENV !== "PRODUCTION") {
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
  }
  
  next();
};

app.use(requestLogger);

// Import Routes
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

// API Routes Configuration
const API_PREFIX = "/api/v2";

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
const routes = [
  { path: 'user', handler: user },
  { path: 'shop', handler: shop },
  { path: 'product', handler: product },
  { path: 'event', handler: event },
  { path: 'coupon', handler: coupon },
  { path: 'payment', handler: payment },
  { path: 'order', handler: order },
  { path: 'conversation', handler: conversation },
  { path: 'message', handler: message },
  { path: 'withdraw', handler: withdraw }
];

routes.forEach(({ path, handler }) => {
  app.use(`${API_PREFIX}/${path}`, handler);
});

// Serve static files in production
if (process.env.NODE_ENV === "PRODUCTION") {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === "DEVELOPMENT" ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  next(err);
});

// Final Error Handler
app.use(ErrorHandler);

// Graceful Shutdown Handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Performing graceful shutdown...');
  // Close any open connections/resources here
});

module.exports = app;