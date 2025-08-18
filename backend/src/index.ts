import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/database";
import routes from "./routes";
import corsMiddleware from "./middleware/cors";
import analyticsRoutes from "./routes/analytics";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "8000", 10);
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

connectDB();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Debug logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Add a simple test route for debugging Railway deployment
app.get("/test", (_req, res) => {
  res.json({
    success: true,
    message: "Direct route test works",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || "8000",
  });
});

app.use("/api", routes);

app.use("/api/analytics", analyticsRoutes);
console.log("📊 Analytics routes mounted at /api/analytics");

// Add root health check
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Cosynq API Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("*", (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

app.listen(PORT, HOST, () => {
  console.log(`🚀 Cosynq backend server running on ${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
