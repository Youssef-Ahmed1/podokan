const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();

// Security
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ['https://testpodokan.store', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['Authorization', 'Seller-Authorization']
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Cookie settings
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  domain: process.env.NODE_ENV === 'production' ? '.testpodokan.store' : undefined,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Routes
const API_PREFIX = '/api/v2';

app.use(`${API_PREFIX}/user`, require('./controller/user'));
app.use(`${API_PREFIX}/shop`, require('./controller/shop'));
app.use(`${API_PREFIX}/product`, require('./controller/product'));
app.use(`${API_PREFIX}/event`, require('./controller/event'));
app.use(`${API_PREFIX}/order`, require('./controller/order'));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    headers: {
      authorization: req.headers.authorization,
      'seller-authorization': req.headers['seller-authorization']
    }
  });
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`
  });
});

module.exports = app;