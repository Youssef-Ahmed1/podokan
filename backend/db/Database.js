// db.js
const mongoose = require("mongoose");

const connectDatabase = () => {
  // Only create one connection
  if (mongoose.connections[0].readyState) {
    console.log("Already connected to MongoDB");
    return;
  }

  mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    .then((data) => {
      console.log(`MongoDB connected with host: ${data.connection.host}`);
    })
    .catch((err) => {
      console.log("MongoDB connection error:", err);
      process.exit(1);
    });
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.log("MongoDB error:", err);
});

module.exports = connectDatabase;