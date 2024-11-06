// server.js
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require("cloudinary").v2;

// Load environment variables first
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env"
  });
} else {
  require("dotenv").config({
    path: path.join(__dirname, "config", ".env")
  });
}

// Validate environment variables
const requiredEnvVars = [
  'DB_URL',
  'JWT_SECRET_KEY',
  'CLOUDINARY_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Import app after environment setup
const app = require("./app");

// Database connection
const connectDatabase = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(process.env.DB_URL, options);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Start server function
const startServer = async () => {
  try {
    await connectDatabase();

    const port = process.env.PORT || 8000;
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
    });

    // Configure server timeouts
    server.timeout = 60000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    // Handle graceful shutdown
    const shutdown = () => {
      console.log('Shutting down server...');
      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('Server closed successfully');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
};

// Error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

// Start the server
startServer();