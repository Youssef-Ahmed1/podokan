const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;
const http = require('http');

require("dotenv").config();

// Environment checks and setup
const validateEnvironment = () => {
  const requiredVars = [
    'JWT_SECRET_KEY',
    'CLOUDINARY_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`);
      process.exit(1);
    }
  });

  if (!process.env.DB_URL && process.env.MONGO_URI) {
    process.env.DB_URL = process.env.MONGO_URI;
  }
};

validateEnvironment();

// Initialize cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create HTTP server
const server = http.createServer(app);

// Configure server timeouts
server.timeout = 120000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Database connection with retry
const connectWithRetry = async (retries = 5) => {
  try {
    await connectDatabase();
    console.log('Database connected successfully');
    startServer();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    if (retries > 0) {
      console.log(`Retrying in 5 seconds... (${retries} attempts remaining)`);
      setTimeout(() => connectWithRetry(retries - 1), 5000);
    } else {
      console.error('Max retries reached. Exiting...');
      process.exit(1);
    }
  }
};

// Server startup
const startServer = () => {
  const port = process.env.PORT || 8000;
  
  server.listen(port, () => {
    console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
      process.exit(1);
    }
    console.error('Server error:', error);
  });
};

// Error handlers
const setupErrorHandlers = () => {
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    server.close(() => process.exit(1));
  });

  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Closing server...');
    server.close(() => process.exit(0));
  });
};

setupErrorHandlers();
connectWithRetry();
