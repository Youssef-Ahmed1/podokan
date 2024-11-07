const app = require("./app");
const connectDatabase = require("./db/Database.js");
const cloudinary = require("cloudinary").v2;
const mongoose = require('mongoose');
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
});


const connectWithRetry = async (retries = 5) => {
  try {
    await connectDatabase();
    const port = process.env.PORT || 8000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log('Database connected');
    });
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
// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received. Starting graceful shutdown...');
  
  try {
      await server.close();
      console.log('HTTP server closed');
      
      if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          console.log('MongoDB connection closed');
      }
      
      process.exit(0);
  } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  server.close(() => process.exit(1));
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

connectWithRetry();