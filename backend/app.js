const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const ErrorHandler = require("./middleware/error");
const app = express();

// --- CORS Configuration ---
const allowedOrigins = (
  process.env.NODE_ENV === "production"
    ? (
        process.env.CORS_ORIGIN || // Use env variable first
        "https://testpodokan.store,https://www.testpodokan.store"
      ) // Default includes both www and non-www
        .split(",")
        .map((origin) => origin.trim().replace(/\/$/, "")) // Normalize and remove trailing slash
    : ["http://localhost:3000"]
) // Development origins
  .filter(Boolean); // Remove empty entries if any

console.log("Allowed CORS Origins:", allowedOrigins); // Log allowed origins for verification

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) OR from whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS Error: Origin '${origin}' not allowed.`);
      // Pass an error to the callback for disallowed origins
      callback(new Error(`Origin '${origin}' not permitted by CORS policy.`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Seller-Authorization"], // Ensure these match frontend requests
  exposedHeaders: ["Authorization", "Seller-Authorization"], // Allow frontend to read these response headers
};
app.use(cors(corsOptions));

// --- Security Middleware ---
app.use(
  helmet({
    contentSecurityPolicy: false, // Consider configuring CSP properly later
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows loading resources (like Cloudinary images)
  })
);

// --- Other Middleware ---
app.use(morgan("dev"));
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
  if (router && typeof router === "function") {
    app.use(`/api/v2/${name}`, router);
    console.log(`API route mounted: /api/v2/${name}`);
  } else {
    console.warn(`Invalid API route for '/api/v2/${name}'. Skipping.`);
  }
});

app.get("/api/v2", (req, res) =>
  res.status(200).json({ message: "Podokan API V2 Running" })
);

// --- Frontend Serving & Fallback (Production) ---
if (process.env.NODE_ENV === "production") {
  const frontendBuildPath = path.resolve(__dirname, "../frontend/build");
  console.log(
    `Production mode: Serving static files from ${frontendBuildPath}`
  );
  app.use(express.static(frontendBuildPath));
  app.get("/health", (req, res) => res.status(200).send("OK"));
  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) return next();
    const indexPath = path.resolve(frontendBuildPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error(
          `Error sending index.html for ${req.originalUrl}:`,
          err.message
        );
        res.status(500).send("Error loading application.");
      }
    });
  });
} else {
  console.log("Development mode: Static files handled by React Dev Server.");
  app.get("/health", (req, res) =>
    res.status(200).json({ status: "healthy", mode: "development" })
  );
}

// --- Error Handling ---
// This should be AFTER all routes and middleware that might call next(err)
app.use(ErrorHandler);

// --- Process Event Handlers ---
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err); // Log the actual rejected value/error
  process.exit(1);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED. Shutting down gracefully...");
  // Add any cleanup logic here (e.g., close database connections)
  process.exit(0);
});

module.exports = app;