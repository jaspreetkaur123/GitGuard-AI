require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
require("./config/passport"); // Initialize passport config

const webhookRoutes = require("./routes/webhook.routes");
const authRoutes = require("./routes/auth.routes");
const paymentRoutes = require("./routes/payment.routes");
const repositoryRoutes = require("./routes/repository.routes");

// Initialize Express app
const app = express();

// Required so secure cookies work correctly behind Vercel proxy
app.set("trust proxy", 1);

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(cookieParser());

// NOTE: Stripe Webhook needs the raw body to verify the signature.
// We mount it BEFORE express.json()
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    // Pass the raw body to the paymentRoutes handler
    next();
  },
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "gitguard_secret",
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/webhooks", webhookRoutes);
app.use("/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/repositories", repositoryRoutes);

// Routes Placeholder
app.get("/", (req, res) => {
  res.json({ message: "GitGuard AI API is running" });
});

// Basic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isProduction = process.env.NODE_ENV === "production";
  res.status(500).send({
    error: isProduction ? "Something went wrong!" : err.message,
  });
});

// For Vercel serverless deployment, export the app
// For local development, still start the server
if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
  // Vercel serverless environment - export the app
  module.exports = app;
} else {
  // Local development - start the server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
  });
}
