const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const sendMail = require('./utils/sendMail');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: [
    'https://testpodokan.store',
    'https://www.testpodokan.store',
    ...(process.env.NODE_ENV !== 'PRODUCTION' ? ['http://localhost:3000'] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie', 'Date', 'ETag'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false
});

// API rate limiter
app.use('/api/', createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests, please try again later.'
));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 2048 * 2048, // 100MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) return cb(null, true);
    cb(new Error("Only images (jpeg, jpg, png, gif) are allowed"));
  }
}).array('files', 5);

// Endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'PODokan Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Email test endpoint
app.get('/test-email', createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 requests per hour
  'Too many email test requests'
), async (req, res) => {
  try {
    console.log('Sending test email...');
    await sendMail({
      email: 'moropass1212@gmail.com',
      subject: 'PODokan Test Email',
      html: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #4e64df;">PODokan Test Email</h2>
          <p>This is a test email sent at: ${new Date().toLocaleString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
        </div>
      `
    });
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Import and configure routes
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

// Mount API routes
Object.entries(routes).forEach(([name, router]) => {
  app.use(`/api/v2/${name}`, router);
});

// Token refresh endpoint
app.post('/api/v2/refresh-token', async (req, res, next) => {
  try {
    const oldToken = req.cookies.token || req.body.token;
    
    if (!oldToken) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const newToken = await refreshToken(oldToken);
    
    res.cookie('token', newToken, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: '/',
      domain: process.env.NODE_ENV === 'PRODUCTION' ? '.testpodokan.store' : undefined
    });

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    next(error);
  }
});

// Error Handlers
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Error type handling
  const errorHandlers = {
    PayloadTooLargeError: () => ({
      status: 413,
      message: 'File size exceeds the limit (100MB)'
    }),
    ValidationError: () => ({
      status: 400,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    }),
    MulterError: () => ({
      status: 400,
      message: 'File upload error',
      error: err.message
    })
  };

  const handler = errorHandlers[err.name];
  if (handler) {
    const { status, ...response } = handler();
    return res.status(status).json({
      success: false,
      ...response
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Performing graceful shutdown...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;