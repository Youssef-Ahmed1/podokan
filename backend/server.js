// server.js
const express = require("express");
const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;
const mongoose = require('mongoose');

// Load environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env"
  });
}

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect Database
connectDatabase()
  .then(() => {
    const server = app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 8000}`);
    });

    // Configure server timeouts
    server.timeout = 120000;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('Server closed');
          process.exit(0);
        });
      });
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});