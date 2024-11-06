// server.js
const express = require("express");
const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary");

// Environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env"
  });
}

// Initialize database connection before starting server
const initializeServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Configure cloudinary after successful DB connection
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Start server only after successful initialization
    const server = app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 8000}`);
    });

    // Configure server timeouts
    server.timeout = 120000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received');
      server.close(async () => {
        await mongoose.connection.close();
        console.log('Server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
};

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Allow process to restart via PM2
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Allow process to restart via PM2
  process.exit(1);
});

initializeServer();