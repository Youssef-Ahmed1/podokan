const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'https://testpodokan.store',
  credentials: true
}));

// Routes without extra /api/v2
app.use("/user", require("./controller/user"));
app.use("/shop", require("./controller/shop"));
app.use("/product", require("./controller/product"));
app.use("/event", require("./controller/event"));
app.use("/order", require("./controller/order"));

mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log("Database connected");
    app.listen(8000, () => console.log("Server running on port 8000"));
  })
  .catch((err) => console.log("Database connection failed:", err));

module.exports = server.js;