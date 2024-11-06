// server.js
const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;
const path = require('path');

// Load environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env"
  });
} else {
  require("dotenv").config({
    path: path.join(__dirname, "config", ".env")
  });
}

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

// Validate required environment variables
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

// Create HTTP server
const server = require('http').createServer(app);

// Configure server timeouts
server.timeout = 120000;
server.headersTimeout = 66000;
server.keepAliveTimeout = 65000;

// Database connection with retry
const connectWithRetry = async (retries = 5) => {
  try {
    await connectDatabase();
    startServer();
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

// Start server
const startServer = async () => {
    try {
      // Connect to database
      await connectDatabase();
  
      // Configure cloudinary
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
  
      // Create server
      const server = app.listen(process.env.PORT || 8000, () => {
        console.log(`Server running on port ${process.env.PORT || 8000}`);
      });
  
      // Configure server timeouts
      server.timeout = 60000;
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
  
    } catch (error) {
      console.error('Startup error:', error);
      process.exit(1);
    }
  };
  
  startServer();

// Start application
connectWithRetry();