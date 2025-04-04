const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const ErrorHandler = require("./middleware/error");

const app = express();

// --- Middleware ---
// ** CORS Configuration - Verify Allowed Origins **
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.CORS_ORIGIN || "https://testpodokan.store").split(",") // Allows multiple comma-separated origins from ENV
    : ["http://localhost:3000"]; // Development origin

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, curl) or from whitelisted origins
    // If you still get CORS errors, temporarily set origin: true for debugging,
    // but revert to the function check for security.
    if (!origin || allowedOrigins.includes(origin)) {
      // Use includes for array check
      callback(null, true);
    } else {
      console.warn(
        `CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(", ")}`
      );
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Seller-Authorization"],
  exposedHeaders: ["Authorization", "Seller-Authorization"],
};
app.use(cors(corsOptions));

app.use(
  helmet({
    // Security Headers
    contentSecurityPolicy: false, // Keep disabled unless fully configured
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("dev")); // Request logging
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(compression());

// --- API Routes ---
const apiRoutes = {
  user: require("./controller/user"),
  shop: require("./controller/shop"),
  product: require("./controller/product"),
  event: require("./controller/event"),
  coupon: require("./controller/coupounCode"),
  payment: require("./controller/payment"),
  order: require("./controller/order"),
  conversation: require("./controller/conversation"),
  message: require("./controller/message"),
  withdraw: require("./controller/withdraw"),
};
Object.entries(apiRoutes).forEach(([name, router]) => {
  if (router && typeof router === "function")
    app.use(`/api/v2/${name}`, router);
  else console.warn(`API route for '/api/v2/${name}' is invalid.`);
});
app.get("/api/v2", (req, res) =>
  res.status(200).json({ message: "Podokan API V2 Active" })
);

// --- Frontend Serving ---
const frontendBuildPath = path.resolve(__dirname, "../frontend/build");
console.log(`Serving static files from: ${frontendBuildPath}`);
app.use(express.static(frontendBuildPath));

app.get("/health", (req, res) => res.status(200).json({ status: "healthy" }));

// SPA Fallback
app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api/")) return next();
  const indexPath = path.resolve(frontendBuildPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(
        `Error sending index.html for ${req.originalUrl}:`,
        err.message
      );
      if (err.code === "ENOENT")
        res.status(404).send("Application entry point not found.");
      else res.status(500).send("Error loading application.");
    }
  });
});

// --- Error Handling ---
app.use(ErrorHandler); // Must be last

// --- Process Event Handlers ---
process.on("uncaughtException", (err) => {
  console.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...\n`, err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error(`UNHANDLED REJECTION! 💥 Shutting down...\n`, err);
  process.exit(1);
});
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down...");
  process.exit(0);
});

module.exports = app;