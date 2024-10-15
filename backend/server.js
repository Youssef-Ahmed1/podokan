const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;
const https = require('https');
const http = require('http');
const fs = require('fs');

// Handling uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to uncaught exception`);
  process.exit(1);
});

// Config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// Connect to database
connectDatabase();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

let server;

if (process.env.NODE_ENV === "PRODUCTION") {
  const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/testpodokan.store/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/testpodokan.store/fullchain.pem')
  };
  server = https.createServer(options, app);
  server.listen(8000, '0.0.0.0', () => {
    console.log(`HTTPS Server is running on port 8000`);
  });

  // We'll let Nginx handle the HTTP to HTTPS redirect
} else {
  server = app.listen(8000, '0.0.0.0', () => {
    console.log(`HTTP Server is running on port 8000`);
  });
}

// Unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server due to ${err.message}`);
  console.log(`Shutting down the server due to unhandled promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});