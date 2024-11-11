// server.js
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'https://testpodokan.store',
  credentials: true
}));

// Define routes with proper API prefix
app.use("/api/v2/user", require("./controller/user"));
app.use("/api/v2/shop", require("./controller/shop"));
app.use("/api/v2/product", require("./controller/product"));
app.use("/api/v2/event", require("./controller/event"));
app.use("/api/v2/order", require("./controller/order"));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message
  });
});

// Connect to MongoDB and start server
mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log("Database connected");
    app.listen(8000, () => console.log("Server running on port 8000"));
  })
  .catch((err) => console.log("Database connection failed:", err));

module.exports = app;