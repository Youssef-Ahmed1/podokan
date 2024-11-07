const app = require("./app");
const connectDatabase = require("./db/Database");
const mongoose = require("mongoose");

let server;

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Error: ${err.message}`);
  console.log("Shutting down server due to uncaught exception");
  process.exit(1);
});

// Config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  try {
    console.log(`${signal} received. Starting graceful shutdown...`);
    
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
        console.log('HTTP server closed');
      });
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Connect database and start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    server = app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on http://localhost:${process.env.PORT || 8000}`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error(`Unhandled Promise Rejection: ${err.message}`);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
};

startServer();