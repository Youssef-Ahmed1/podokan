const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;
const http = require('http');

// Load environment variables
require("dotenv").config();

// Set DB_URL from ecosystem config if not set
if (!process.env.DB_URL && process.env.MONGO_URI) {
    process.env.DB_URL = process.env.MONGO_URI;
}

// Debug logging
console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    DB_URL: process.env.DB_URL ? 'Set' : 'Not set',
    PORT: process.env.PORT || 8000
});

// Error handlers
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
  });
  
  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
    server.close(() => process.exit(1));
  });
  
  // Add request logging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      query: req.query,
      cookies: req.cookies,
      headers: {
        authorization: req.headers.authorization ? 'present' : 'missing',
        'seller-authorization': req.headers['seller-authorization'] ? 'present' : 'missing'
      }
    });
    next();
  });

// Connect database with retry mechanism
const connectWithRetry = async () => {
    try {
        await connectDatabase();
        console.log('Database connected successfully');
    } catch (err) {
        console.log('Database connection failed, retrying in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};

connectWithRetry();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create HTTP server with timeout
const server = http.createServer(app);
server.timeout = 300000; // 5 minutes timeout

// Start server
server.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port ${process.env.PORT || 8000}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to unhandled promise rejection`);
    server.close(() => {
        process.exit(1);
    });
});