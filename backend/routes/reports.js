const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /reports/gst - Custom basic GST report
router.get("/gst", async (req, res) => {
    try {
        // Fetch all orders with tax > 0
        const result = await db.query(`
            SELECT id, created_at, customer_name, total_amount, tax_amount 
            FROM orders 
            ORDER BY created_at DESC
        `);

        // Calculate breakdown
        const report = result.rows.map(order => {
            const tax = parseFloat(order.tax_amount || 0);
            const total = parseFloat(order.total_amount);
            const taxable = total - tax;
            return {
                ...order,
                taxable_value: taxable.toFixed(2),
                cgst: (tax / 2).toFixed(2),
                sgst: (tax / 2).toFixed(2)
            };
        });

        res.json(report);
    } catch (err) {
        console.error("REPORT ERROR:", err);
        res.status(500).json({ error: "Failed to fetch report" });
    }
});

module.exports = router;
