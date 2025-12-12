const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");

router.get("/stats", auth.verifyToken, async (req, res) => {
    try {
        // 1. Top Selling (by quantity) - Filtered by User
        const topSelling = await db.query(`
        SELECT p.id, p.name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE p.user_id = $1
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 5
    `, [req.userId]);

        // 2. Low Selling (Bottom 5) - Filtered by User
        const lowSelling = await db.query(`
        SELECT p.id, p.name, COALESCE(SUM(oi.quantity), 0) as total_sold
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        WHERE p.user_id = $1
        GROUP BY p.id, p.name
        ORDER BY total_sold ASC
        LIMIT 5
    `, [req.userId]);

        // 3. Low Stock (< 10) - Filtered by User
        const lowStock = await db.query(`
        SELECT * FROM products WHERE stock < 10 AND user_id = $1 ORDER BY stock ASC
    `, [req.userId]);

        res.json({
            topSelling: topSelling.rows,
            lowSelling: lowSelling.rows,
            lowStock: lowStock.rows
        });
    } catch (err) {
        console.error("STATS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// 4. Sales Analytics (Daily, Monthly, Yearly)
router.get("/sales", auth.verifyToken, async (req, res) => {
    try {
        const { period, date, year, month } = req.query; // period: 'daily', 'monthly', 'yearly'
        let query = "";
        let params = [req.userId];

        if (period === "daily") {
            // date format: YYYY-MM-DD
            query = `
                SELECT 
                    SUM(total_amount) as total_sales, 
                    COUNT(*) as total_orders 
                FROM orders 
                WHERE user_id = $1 AND DATE(created_at) = $2
            `;
            params.push(date);
        } else if (period === "monthly") {
            // year: YYYY, month: 1-12
            query = `
                SELECT 
                    SUM(total_amount) as total_sales, 
                    COUNT(*) as total_orders 
                FROM orders 
                WHERE user_id = $1 
                AND EXTRACT(YEAR FROM created_at) = $2 
                AND EXTRACT(MONTH FROM created_at) = $3
            `;
            params.push(year, month);
        } else if (period === "yearly") {
            // year: YYYY
            query = `
                SELECT 
                    SUM(total_amount) as total_sales, 
                    COUNT(*) as total_orders 
                FROM orders 
                WHERE user_id = $1 
                AND EXTRACT(YEAR FROM created_at) = $2
            `;
            params.push(year);
        } else {
            return res.status(400).json({ error: "Invalid period" });
        }

        const result = await db.query(query, params);
        res.json(result.rows[0] || { total_sales: 0, total_orders: 0 });

    } catch (err) {
        console.error("ANALYTICS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch sales data" });
    }
});

module.exports = router;
