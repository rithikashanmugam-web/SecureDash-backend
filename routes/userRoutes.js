const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AVAILABLE_MODULES } = require("../models/User");
const { protect, isSuperAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ---------------------------------
// 🔹 Create Super Admin (only once)
// ---------------------------------
router.post("/createsuperadmin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Prevent multiple superadmins
    const existingSuper = await User.findOne({ role: "superadmin" });
    if (existingSuper) return res.status(400).json({ message: "Super Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: "superadmin",
      modules: AVAILABLE_MODULES // Full access
    });

    await superAdmin.save();
    res.json({ message: "Super Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------
// 🔹 Login for any user
// -------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      role: user.role,
      modules: user.modules,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------
// 🔹 Get Available Modules (SuperAdmin only)
// ---------------------------------
router.get("/modules", protect, isSuperAdmin, (req, res) => {
  res.json({ modules: AVAILABLE_MODULES });
});

// ---------------------------------
// 🔹 Create Admin or User (SuperAdmin only)
// ---------------------------------
router.post("/register", protect, isSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role, modules } = req.body;

    if (!["admin", "user"].includes(role)) return res.status(400).json({ message: "Invalid role" });

    // Validate modules
    const invalidModules = modules.filter(m => !AVAILABLE_MODULES.includes(m));
    if (invalidModules.length > 0) return res.status(400).json({ message: `Invalid modules: ${invalidModules.join(", ")}` });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, role, modules });
    await newUser.save();

    res.json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        modules: newUser.modules,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------
// 🔹 List All Users (SuperAdmin only)
// ---------------------------------
router.get("/", protect, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["admin", "user"] } }).select("-password -__v");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------
// 🔹 Update a User (SuperAdmin only)
// ---------------------------------
router.put("/:id", protect, isSuperAdmin, async (req, res) => {
  try {
    const { role, modules, name, email, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (role && !["admin", "user"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (modules) {
      const invalid = modules.filter(m => !AVAILABLE_MODULES.includes(m));
      if (invalid.length > 0) return res.status(400).json({ message: `Invalid modules: ${invalid.join(", ")}` });
      user.modules = modules;
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.json({ message: "User updated successfully", user: { id: user._id, name: user.name, email: user.email, role: user.role, modules: user.modules } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------
// 🔹 Delete a User (SuperAdmin only)
// ---------------------------------
router.delete("/:id", protect, isSuperAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------
// 🔹 Get Current Logged-in User (/me)
// ---------------------------------
router.get("/me", protect, async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ message: "User not found" });
    res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, modules: req.user.modules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------------
// 🔹 Update Profile (Logged-in User)
// ---------------------------------
router.put("/updateProfile", protect, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();
    res.json({ message: "Profile updated", user: { id: user._id, name: user.name, email: user.email, role: user.role, modules: user.modules } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
