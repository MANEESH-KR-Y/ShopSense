const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");

// Get all notifications for user
router.get("/", auth.verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// Mark as read
router.put("/:id/read", auth.verifyToken, async (req, res) => {
    try {
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
            [req.params.id, req.userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ error: "Failed to update notification" });
    }
});

// Mark ALL as read
router.put("/read-all", auth.verifyToken, async (req, res) => {
    try {
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
            [req.userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Error marking all as read:", err);
        res.status(500).json({ error: "Failed to update notifications" });
    }
});

module.exports = router;
