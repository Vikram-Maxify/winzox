const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  forgotPassword,
  verifyOTPAndReset,
  changePassword,
  getAllUsers,
  updateUserStatus,
} = require("../controllers/auth");

const { protect, adminProtect } = require("../middleware/authMiddleware.js");

// ======================================================
// PUBLIC ROUTES
// ======================================================

// Auth Routes
router.post("/register", register);
router.post("/login", login);

// Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", verifyOTPAndReset);

// ======================================================
// PROTECTED ROUTES (Requires Authentication)
// ======================================================

// User Profile Routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Account Management Routes
router.post("/logout", protect, logout);
router.put("/change-password", protect, changePassword);

// ======================================================
// ADMIN ROUTES (Optional - if needed)
// ======================================================
router.get("/admin/users", protect, adminProtect, getAllUsers);
router.put(
  "/admin/users/:userId/status",
  protect,
  adminProtect,
  updateUserStatus
);
module.exports = router;