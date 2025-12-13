const db = require('../db');

async function showNotifications() {
    try {
        console.log("--- FETCHING NOTIFICATIONS ---");
        const res = await db.query("SELECT id, user_id, title, message, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 10");

        if (res.rows.length === 0) {
            console.log("No notifications found.");
        } else {
            console.table(res.rows);
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

showNotifications();
