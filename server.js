const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
app.use(express.json());

// ✅ CORS setup: allow local + deployed frontend
const allowedOrigins = [
  "http://localhost:5173",
  "https://securedash-frontend.onrender.com", // deployed frontend URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin); // optional logging
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // include OPTIONS
    allowedHeaders: ["Content-Type", "Authorization"], // include headers needed for JWT
    credentials: true,
  })
);

// ✅ Handle OPTIONS preflight requests for all routes
app.options("*", cors());

// ✅ API routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// ✅ Serve frontend in production
const frontendBuildPath = path.join(__dirname, "../frontend/dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendBuildPath));

  // ⚡ React Router catch-all
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
