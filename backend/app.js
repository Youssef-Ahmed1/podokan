const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const ErrorHandler = require("./middleware/error");

const app = express();

// Load environment variables first
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ['http://localhost:3000', 'https://testpodokan.store'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
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
  ]
};

app.use(cors(corsOptions));

// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Authorization, Seller-Authorization');
  next();
});

// Essential middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Add request logging in development
if (process.env.NODE_ENV !== "PRODUCTION") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
  });
}

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

// API Routes with prefix
const API_PREFIX = "/api/v2";

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// Error handling middleware must be last
app.use(ErrorHandler);

module.exports = app;