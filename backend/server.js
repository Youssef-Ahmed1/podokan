const express = require("express");
const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;
const mongoose = require('mongoose');

// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server for handling uncaught exception`);
  process.exit(1);
});

// Config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// Connect database
mongoose.set('strictQuery', false);
connectDatabase()
  .then(() => {
    console.log('Database connected successfully');
    startServer();
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function startServer() {
  const server = app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 8000}`);
  });

  // Configure server timeouts
  server.timeout = 120000; // 2 minutes
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Handling Unhandled Promise Rejection
  process.on("unhandledRejection", (err) => {
    console.log(`Shutting down the server for ${err.message}`);
    console.log(`Shutting down the server for unhandled promise rejection`);

    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Received shutdown signal');
    
    server.close(async () => {
      console.log('HTTP server closed');
      try {
        await mongoose.connection.close(false);
        console.log('Database connection closed');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });

    // Force close after 30 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;