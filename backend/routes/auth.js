const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOtp);
router.post("/login-otp", authController.verifyOtpAndLogin);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", auth.verifyToken, authController.changePassword);

router.post("/token", authController.token);
router.get("/me", auth.verifyToken, authController.me);
router.post("/logout", auth.verifyToken, authController.logout);

// Keep update for now or move to controller? Let's keep existing structure for update
// Actually let's just move update to controller too to be clean but I missed it in the controller code above.
// I will keep the inline update route here if I didn't add it to controller, OR I will add it to controller in a fix step.
// For now, to avoid breaking, I will keep the update route here or migrate it.
// Checking my previous write_to_file for authController... I did NOT include updateProfile.
// So I will keep the update route inline here for now to avoid breaking it.

const User = require("../models/User"); // Needed for inline update
router.put("/update", auth.verifyToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.userId;

    if (email) {
      const existing = await User.findByEmail(email);
      if (existing && existing.id !== userId) {
        return res.status(400).json({ error: "Email already taken" });
      }
    }

    if (phone) {
      const existing = await User.findByPhone(phone);
      if (existing && existing.id !== userId) {
        return res.status(400).json({ error: "Phone already taken" });
      }
    }

    await User.update(userId, { name, email, phone });
    const user = await User.findById(userId);

    return res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
