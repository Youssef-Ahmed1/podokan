// app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const ErrorHandler = require("./middleware/error");

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://testpodokan.store'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Seller-Authorization'],
  exposedHeaders: ['Authorization', 'Seller-Authorization']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

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

// Error handling
app.use(ErrorHandler);

module.exports = app;