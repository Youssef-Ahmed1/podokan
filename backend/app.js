const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const ErrorHandler = require("./middleware/error");
const app = express();
const limiter = require("./middleware/rateLimiter");
// --- CORS Configuration ---
const allowedOrigins = [
    "http://localhost:3000", // Your React Local Server
    process.env.CORS_ORIGIN, // Your future production URL from .env
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(
                new Error(`Origin '${origin}' not permitted by CORS policy.`),
            );
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type"], // Crucial for our new HttpOnly Cookies!
};
app.use(cors(corsOptions));
// --- Security Middleware ---
app.use(
    helmet({
        contentSecurityPolicy: true, // Consider configuring CSP properly later
        crossOriginEmbedderPolicy: true,
        crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows loading resources (like Cloudinary images)
    }),
);

// --- Other Middleware ---
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(compression());
app.use("/api/v2/", limiter);
// --- API Routes ---
const apiRoutes = {
    user: require("./controller/user"),
    shop: require("./controller/shop"),
    product: require("./controller/product"),
    event: require("./controller/event"),
    coupon: require("./controller/couponCode"),
    order: require("./controller/order"),
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
