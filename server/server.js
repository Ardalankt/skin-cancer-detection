import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import scanRoutes from "./routes/scans.js";
import { verifyToken } from "./middleware/auth.js";
import fs from "fs";

// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5050;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  console.log("Creating uploads directory:", uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve static files from uploads directory
// Make sure the path is correct and accessible
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log("Serving static files from:", path.join(__dirname, "uploads"));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", verifyToken, userRoutes);
app.use("/api/scans", verifyToken, scanRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("DermaScan API is running");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
  })
  .catch((error) => console.log(`${error} did not connect`));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;
