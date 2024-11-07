const app = require("./app");
const connectDatabase = require("./db/Database.js");
const cloudinary = require("cloudinary").v2;

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

const server = require('http').createServer(app);

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

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  server.close(() => process.exit(1));
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

connectWithRetry();