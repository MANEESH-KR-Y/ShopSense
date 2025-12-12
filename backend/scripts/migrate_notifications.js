const db = require('../db');

async function migrate() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                message TEXT,
                type VARCHAR(50) DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Notifications table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
