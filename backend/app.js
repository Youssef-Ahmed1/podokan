const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const compression = require("compression"); // Compresses response bodies
const helmet = require("helmet"); // Sets various security headers
const morgan = require("morgan"); // HTTP request logger
const ErrorHandler = require("./middleware/error"); // Custom error handler middleware
const app = express();

// --- Essential Middleware ---

const allowedOrigins = (
  process.env.NODE_ENV === "production"
    ? (
        process.env.CORS_ORIGIN ||
        "https://testpodokan.store" ||
        "http://testpodokan.store"
      )
        .split(",")
        .map((origin) => origin.trim().replace(/\/$/, "")) // *** This removes trailing slash ***
    : ["http://localhost:3000"]
).filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) OR from whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(
        `CORS Error: Origin '${origin}' not allowed. Allowed: ${allowedOrigins.join(
          ", "
        )}`
      );
      callback(new Error(`Origin '${origin}' not permitted by CORS policy.`)); // Deny request
    }
  },
  credentials: true, // Allow cookies to be sent with requests
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization", "Seller-Authorization"], // Headers frontend can send
  exposedHeaders: ["Authorization", "Seller-Authorization"], // Headers frontend can access in response (e.g., refreshed tokens)
};
app.use(cors(corsOptions)); // Enable CORS with specified options

app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP unless you configure it thoroughly
    crossOriginEmbedderPolicy: false, // Might be needed depending on resource embedding
    // Allows resources (like images from Cloudinary) to be loaded cross-origin
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Request Logging (Using 'dev' format for concise output during development)
app.use(morgan("dev"));

// Body Parsers (for handling JSON and URL-encoded request bodies)
app.use(express.json({ limit: "50mb" })); // Increase limit if handling large uploads (e.g., images)
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Cookie Parser (for accessing `req.cookies`)
app.use(cookieParser());

// Response Compression (Reduces Size of responses like JSON, HTML)
app.use(compression());

// --- API Routes ---
// Load route controllers
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
  // Add other controllers here
};

// Mount API routes under /api/v2/
Object.entries(apiRoutes).forEach(([name, router]) => {
  if (router && typeof router === "function") {
    // Check if it's a valid router
    app.use(`/api/v2/${name}`, router);
    console.log(`API route mounted: /api/v2/${name}`);
  } else {
    console.warn(`Invalid API route object for '/api/v2/${name}'. Skipping.`);
  }
});

app.get("/api/v2", (req, res) =>
  res.status(200).json({ message: "Podokan API V2 Running" })
);

if (process.env.NODE_ENV === "production") {
  const frontendBuildPath = path.resolve(__dirname, "../frontend/build");
  console.log(
    `Production mode: Serving static files from ${frontendBuildPath}`
  );

  app.use(express.static(frontendBuildPath));

  // Health check endpoint (useful for load balancers, monitoring)
  app.get("/health", (req, res) => res.status(200).send("OK"));

  app.get("*", (req, res, next) => {
    // Avoid interfering with API routes (though they should be handled already)
    if (req.originalUrl.startsWith("/api/")) {
      return next();
    }
    // Send the main HTML file for any other GET request
    const indexPath = path.resolve(frontendBuildPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        // Log error but avoid sending verbose errors to client
        console.error(
          `Error sending index.html for ${req.originalUrl}:`,
          err.message
        );
        res.status(500).send("Error loading application.");
      }
    });
  });
} else {
  console.log(
    "Development mode: Static file serving and SPA fallback handled by React Dev Server."
  );
  // Health check endpoint for development
  app.get("/health", (req, res) =>
    res.status(200).json({ status: "healthy", mode: "development" })
  );
}

app.use(ErrorHandler);

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1); // Mandatory exit
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  // Log the error object itself for more details if available
  console.error(err); // Log the rejection reason (could be Error object or something else)
  process.exit(1); // Mandatory exit
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully...");
  console.log("HTTP server closed.");
  process.exit(0); // Exit successfully
  // });
});


module.exports = app;