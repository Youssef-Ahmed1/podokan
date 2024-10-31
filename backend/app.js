const express = require("express");
const ErrorHandler = require("./utils/ErrorHandler");
const errorMiddleware = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const emailService = require('./utils/sendMail');  
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const { isAuthenticated, isSeller } = require('./middleware/auth');
const app = express();

// Security middleware with proper CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
      imgSrc: ["'self'", "data:", "blob:", "https://*.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'PRODUCTION',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://testpodokan.store',
      'https://www.testpodokan.store',
      ...(process.env.NODE_ENV !== 'PRODUCTION' ? ['http://localhost:3000'] : [])
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Token verification middleware
app.use(async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    const sellerToken = req.cookies.seller_token || req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = await User.findById(decoded.id).select('-password');
    }

    if (sellerToken) {
      const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET_KEY);
      req.seller = await Shop.findById(decoded.id).select('-password');
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    next();
  }
});

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

// API rate limiters
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests');
const authLimiter = createRateLimiter(60 * 60 * 1000, 5, 'Too many auth attempts');

app.use('/api/v2/', generalLimiter);
app.use('/api/v2/user/login', authLimiter);
app.use('/api/v2/shop/login', authLimiter);

// Middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Security headers middleware
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('Referrer-Policy', 'same-origin');
  next();
});

// Request logging with sensitive data masking
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  const sanitizedBody = req.method !== 'GET' ? 
    JSON.parse(JSON.stringify(req.body).replace(/"password":"[^"]+"/g, '"password":"[FILTERED]"')) : 
    undefined;

  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`, {
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[FILTERED]' : undefined
    },
    query: req.query,
    body: sanitizedBody
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new ErrorHandler("Only images (jpeg, jpg, png, gif) up to 5MB are allowed", 400));
  }
}).array('files', 5);

// Global upload middleware
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(new ErrorHandler(err.message, 400));
      }
      if (err) {
        return next(new ErrorHandler(err.message, 500));
      }
      next();
    });
  } else {
    next();
  }
});

// API routes
const API_BASE = '/api/v2';

// Protected route configuration
const protectedRoutes = [
  {
    path: '/user',
    router: require("./controller/user"),
    auth: 'user',
    except: ['login', 'register', 'verify']
  },
  {
    path: '/shop',
    router: require("./controller/shop"),
    auth: 'seller',
    except: ['login', 'register']
  },
  {
    path: '/product',
    router: require("./controller/product"),
    auth: 'seller',
    except: ['get', 'search']
  },
  {
    path: '/order',
    router: require("./controller/order"),
    auth: 'both'
  },
  {
    path: '/conversation',
    router: require("./controller/conversation"),
    auth: 'both'
  },
  {
    path: '/message',
    router: require("./controller/message"),
    auth: 'both'
  },
  {
    path: '/withdraw',
    router: require("./controller/withdraw"),
    auth: 'seller'
  },
  {
    path: '/event',
    router: require("./controller/event"),
    auth: 'seller',
    except: ['get']
  },
  {
    path: '/coupon',
    router: require("./controller/coupounCode"),
    auth: 'seller',
    except: ['get']
  }
];

// Mount routes with authentication
protectedRoutes.forEach(({ path, router, auth, except = [] }) => {
  const routePath = `${API_BASE}${path}`;
  
  if (auth === 'user') {
    app.use(routePath, (req, res, next) => {
      if (except.some(route => req.path.includes(route))) {
        return next();
      }
      isAuthenticated(req, res, next);
    }, router);
  } else if (auth === 'seller') {
    app.use(routePath, (req, res, next) => {
      if (except.some(route => req.path.includes(route))) {
        return next();
      }
      isSeller(req, res, next);
    }, router);
  } else if (auth === 'both') {
    app.use(routePath, (req, res, next) => {
      if (req.user || req.seller) {
        return next();
      }
      next(new ErrorHandler('Authentication required', 401));
    }, router);
  } else {
    app.use(routePath, router);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  next(err);
});

// 404 Handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl.replace(API_BASE, '')
  });
});

// Final error handling
app.use(errorMiddleware);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

module.exports = app;