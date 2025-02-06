const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from config folder
dotenv.config({ path: path.join(__dirname, 'config', '.env') });

const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

let server;

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    const PORT = process.env.PORT || 8000;
    server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Start the server
startServer();