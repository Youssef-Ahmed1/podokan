// File: backend/app.js
const express = require("express"),
  cookieParser = require("cookie-parser"),
  cors = require("cors"),
  path = require("path"),
  compression = require("compression"),
  helmet = require("helmet"),
  morgan = require("morgan"),
  ErrorHandler = require("./middleware/error"),
  app = express();
const allowedOrigins = (
  process.env.NODE_ENV === "production"
    ? (
        process.env.CORS_ORIGIN ||
        "https://testpodokan.store,http://testpodokan.store"
      )
        .split(",")
        .map((o) => o.trim().replace(/\/$/, ""))
    : ["http://localhost:3000"]
).filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, !0);
    else callback(new Error(`Origin '${origin}' not permitted by CORS.`));
  },
  credentials: !0,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Seller-Authorization"],
  exposedHeaders: ["Authorization", "Seller-Authorization"],
};
app.use(cors(corsOptions));
app.use(
  helmet({
    contentSecurityPolicy: !1,
    crossOriginEmbedderPolicy: !1,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: !0, limit: "50mb" }));
app.use(cookieParser());
app.use(compression());
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
  else console.warn(`Invalid route object for '/api/v2/${name}'.`);
});
app.get("/api/v2", (req, res) =>
  res.status(200).json({ message: "Podokan API V2 Running" })
);
if ("production" === process.env.NODE_ENV) {
  const buildPath = path.resolve(__dirname, "../frontend/build");
  console.log(`Production: Serving static files from ${buildPath}`);
  app.use(express.static(buildPath));
  app.get("/health", (req, res) => res.status(200).send("OK"));
  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) return next();
    res.sendFile(path.resolve(buildPath, "index.html"), (err) => {
      if (err) res.status(500).send("Error loading application.");
    });
  });
} else {
  console.log("Development mode.");
  app.get("/health", (req, res) =>
    res.status(200).json({ status: "healthy", mode: "development" })
  );
}
app.use(ErrorHandler);
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥", err);
  process.exit(1);
});
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down...");
  process.exit(0);
});
module.exports = app;
