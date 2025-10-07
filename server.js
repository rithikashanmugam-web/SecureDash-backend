const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
app.use(express.json());

// ✅ CORS configuration
const allowedOrigins = [
  "https://securedash-frontend.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman) or allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Optional — helps preflight (OPTIONS) requests succeed
app.options("*", cors());

// ✅ API routes
const userRoutes = require("./routes/userRoutes");
app.use("/users", userRoutes); // Notice: No "/api" prefix (matches your frontend call)

// ✅ Serve frontend in production
// ✅ Serve frontend in production
const frontendBuildPath = path.join(__dirname, "../frontend/dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendBuildPath));

  // ⚡ Fix for Express v5 (use regex instead of * or /*)
  app.get((req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}


// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
