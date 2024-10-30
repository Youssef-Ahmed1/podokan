const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;
const http = require('http');

// Load environment variables first
require("dotenv").config();

// Debug logging
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_URL: process.env.DB_URL ? 'Set' : 'Not set',
  PORT: process.env.PORT || 8000
});

// Handling uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to uncaught exception`);
  process.exit(1);
});

// Connect to database
connectDatabase();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create HTTP server - Let Nginx handle SSL
const server = http.createServer(app);

server.listen(8000, '127.0.0.1', () => {
  console.log(`Server is running on port 8000`);
});

// Unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server due to ${err.message}`);
  console.log(`Shutting down the server due to unhandled promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});