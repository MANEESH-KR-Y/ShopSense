const cron = require('node-cron');
const analyticsService = require('../services/analyticsService');
const emailService = require('../services/emailService');
const firebaseService = require('../services/firebaseService');
const db = require('../db');

/**
 * Fetch all admin users (for sending reports)
 * Assuming users table has email and device_token
 */
async function getAdminEmails() {
    // For now, get all users or specific logic. 
    // Assuming simple single-tenant or getting all business owners.
    const res = await db.query("SELECT email, id, device_token FROM users");
    return res.rows;
}

/**
 * Generate HTML Report for Daily Stats
 */
function generateDailyReport(date, salesData, stats) {
    return `
    <h1>Daily Sales Report - ${date}</h1>
    <h2>Total Sales: ₹${salesData.total_sales || 0}</h2>
    <h3>Total Orders: ${salesData.total_orders || 0}</h3>
    
    <hr/>
    <h3>Top Selling Items</h3>
    <ul>
        ${stats.topSelling.map(p => `<li>${p.name}: ${p.total_sold} sold</li>`).join('')}
    </ul>

    <h3>Low Stock Alerts</h3>
    <ul>
        ${stats.lowStock.map(p => `<li style="color:red">${p.name}: Only ${p.stock} left!</li>`).join('')}
    </ul>
    `;
}

/**
 * Generate HTML Report for Monthly Stats
 */
function generateMonthlyReport(month, year, salesData, stats) {
    return `
    <h1>Monthly Sales Report - ${month}/${year}</h1>
    <h2>Total Sales: ₹${salesData.total_sales || 0}</h2>
    <h3>Total Orders: ${salesData.total_orders || 0}</h3>
    
    <hr/>
    <h3>Top Selling Items (All Time)</h3>
    <ul>
        ${stats.topSelling.map(p => `<li>${p.name}: ${p.total_sold} sold</li>`).join('')}
    </ul>
    `;
}


// --- SCHEDULES ---

// 1. Daily Analysis at 10 PM (22:00)
cron.schedule('0 22 * * *', async () => {
    console.log("Running Daily Analysis Job...");
    const users = await getAdminEmails();
    const today = new Date().toISOString().split('T')[0];

    for (const user of users) {
        try {
            const sales = await analyticsService.getSalesData(user.id, 'daily', today);
            const stats = await analyticsService.getStats(user.id);
            const html = generateDailyReport(today, sales, stats);

            // Send Email
            await emailService.sendEmail(user.email, `Daily Sales Report - ${today}`, "Please view HTML", html);

            // Save to In-App Notifications
            const dailyTitle = `Daily Report - ${today}`;
            const dailyBody = `Daily Sales: ₹${sales.total_sales || 0} | Orders: ${sales.total_orders || 0}`;

            await db.query(`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES ($1, $2, $3, 'report')
            `, [user.id, dailyTitle, dailyBody]);

            // Send Firebase Notification
            if (user.device_token) {
                await firebaseService.sendNotification(user.device_token, dailyTitle, dailyBody);
            }

        } catch (err) {
            console.error(`Failed to send daily report to ${user.email}`, err);
        }
    }
});

// 2. Monthly Analysis at 1st of every month at 10 PM
cron.schedule('0 22 1 * *', async () => {
    console.log("Running Monthly Analysis Job...");
    const users = await getAdminEmails();
    const date = new Date();
    const month = date.getMonth() + 1; // Current month (or previous? usually current if end of day)
    const year = date.getFullYear();

    for (const user of users) {
        try {
            const sales = await analyticsService.getSalesData(user.id, 'monthly', null, year, month);
            const stats = await analyticsService.getStats(user.id); // Maybe fetch monthly stats if granular? defaults to all time/current state
            const html = generateMonthlyReport(month, year, sales, stats);

            // Send Email
            await emailService.sendEmail(user.email, `Monthly Sales Report - ${month}/${year}`, "Please view HTML", html);

            // Save to In-App Notifications
            const monthlyTitle = `Monthly Report - ${month}/${year}`;
            const monthlyBody = `Total Sales: ₹${sales.total_sales || 0} | Total Orders: ${sales.total_orders || 0}`;

            await db.query(`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES ($1, $2, $3, 'report')
            `, [user.id, monthlyTitle, monthlyBody]);

            // Send Firebase Notification
            if (user.device_token) {
                await firebaseService.sendNotification(user.device_token, monthlyTitle, monthlyBody);
            }

        } catch (err) {
            console.error(`Failed to send monthly report to ${user.email}`, err);
        }
    }
});

console.log("Cron Scheduler Initialized: Daily (10PM) & Monthly (1st, 10PM)");
