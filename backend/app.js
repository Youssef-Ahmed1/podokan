const express = require("express");
const fs = require('fs').promises;
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require('multer');
const path = require('path');

const createUploadsDirectory = async () => {
  const uploadPath = path.join(__dirname, 'uploads');
  try {
    await fs.access(uploadPath);
    console.log('Uploads directory exists');
  } catch (error) {
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      console.log('Created uploads directory');
    } catch (mkdirError) {
      console.error('Error creating uploads directory:', mkdirError);
    }
  }
};

const corsOptions = {
  origin: ['https://testpodokan.store', 'https://www.testpodokan.store', 'http://localhost:3000', 'http://www.testpodokan.store'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Seller-Authorization'],
  exposedHeaders: ['Authorization', 'Seller-Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  const originalCookie = res.cookie;
  res.cookie = function(name, value, options = {}) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.testpodokan.store',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      ...options
    };
    return originalCookie.call(this, name, value, cookieOptions);
  };
  next();
});

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

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Images Only!"));
  }
});

createUploadsDirectory().catch(console.error);

const API_PREFIX = "/api/v2";

app.use(`${API_PREFIX}/user`, require("./controller/user"));
app.use(`${API_PREFIX}/shop`, require("./controller/shop"));
app.use(`${API_PREFIX}/product`, require("./controller/product"));
app.use(`${API_PREFIX}/event`, require("./controller/event"));
app.use(`${API_PREFIX}/coupon`, require("./controller/coupounCode"));
app.use(`${API_PREFIX}/payment`, require("./controller/payment"));
app.use(`${API_PREFIX}/order`, require("./controller/order"));
app.use(`${API_PREFIX}/conversation`, require("./controller/conversation"));
app.use(`${API_PREFIX}/message`, require("./controller/message"));
app.use(`${API_PREFIX}/withdraw`, require("./controller/withdraw"));

app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(504).json({
      success: false,
      message: "Request timeout"
    });
  });
  next();
});

app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path
  });

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON' });
  }

  if (err.name === 'PayloadTooLargeError') {
    return res.status(413).json({ success: false, message: 'Request entity too large' });
  }

  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
    return res.status(504).json({ success: false, message: 'Request timeout' });
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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = app;