const mongoose = require("mongoose");

// ✅ Define all available modules here
const AVAILABLE_MODULES = ["inventory", "reports", "dashboard", "settings", "analytics"];

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"], 
      trim: true 
    },
    email: { 
      type: String, 
      required: [true, "Email is required"], 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: [true, "Password is required"], 
      minlength: 6 
    },
    role: { 
      type: String, 
      enum: ["superadmin", "admin", "user"], 
      default: "user" 
    },
    modules: { 
      type: [String], 
      default: [], 
      validate: {
        validator: function (arr) {
          return arr.every(m => AVAILABLE_MODULES.includes(m));
        },
        message: `Modules must be from the available list: ${AVAILABLE_MODULES.join(", ")}`
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
module.exports.AVAILABLE_MODULES = AVAILABLE_MODULES; // export list for frontend usage
