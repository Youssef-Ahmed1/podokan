require("dotenv").config({
  path: "config/.env",
});

const app = require("./app");
const connectDatabase = require("./db/Database.js");
const cloudinary = require("cloudinary").v2;

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create HTTP server
const httpServer = require('http').createServer(app);

// Database connection with retry
const connectWithRetry = async (retries = 5) => {
  try {
    await connectDatabase();
    const port = process.env.PORT || 8000;
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log('Database connected');
    });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    if (retries > 0) {
      console.log(`Retrying in 5 seconds... (${retries} attempts remaining)`);
      setTimeout(() => connectWithRetry(retries - 1), 5000);
    } else {
      console.error('Max retries reached, exiting...');
      process.exit(1);
    }
  }
};

// Error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  httpServer.close(() => process.exit(1));
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  httpServer.close(() => process.exit(1));
});

// Start the server
connectWithRetry();
