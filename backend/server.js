// server.js
const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;

// Debug logging
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_URL: process.env.DB_URL ? 'Set' : 'Not set',
  PORT: process.env.PORT || 8000
});

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
const startServer = () => {
  const port = process.env.PORT || 8000;
  server.listen(port, () => {
    console.log(`Server is running on port ${port} in ${process.env.NODE_ENV} mode`);
  });
};

// Error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Start application
connectWithRetry();