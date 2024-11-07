// server.js
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

// MongoDB connection
mongoose.connect(process.env.DB_URL)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("Database connection failed:", err));

// Routes
app.use("/api/v2/user", require("./controller/user"));
app.use("/api/v2/shop", require("./controller/shop"));
app.use("/api/v2/product", require("./controller/product"));
app.use("/api/v2/event", require("./controller/event"));
app.use("/api/v2/order", require("./controller/order"));

// Start server
app.listen(8000, () => {
  console.log("Server running on port 8000");
});