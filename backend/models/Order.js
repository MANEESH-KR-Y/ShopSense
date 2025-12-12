const db = require("../db");

class Order {
    static async create({ customerName, totalAmount, taxAmount, items }) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Create Order
            const orderRes = await client.query(
                `INSERT INTO orders (customer_name, total_amount, tax_amount) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
                [customerName, totalAmount, taxAmount || 0]
            );
            const order = orderRes.rows[0];

            // 2. Create Order Items
            for (const item of items) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
                    [order.id, item.productId, item.quantity, item.price]
                );
            }

            await client.query("COMMIT");
            return order;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }

    static async findAll(userId) {
        const res = await db.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        return res.rows;
    }

    static async findById(orderId, userId) {
        const client = await db.pool.connect();
        try {
            // 1. Fetch Order (Verify ownership)
            const orderRes = await client.query(`SELECT * FROM orders WHERE id=$1 AND user_id=$2`, [orderId, userId]);
            if (orderRes.rows.length === 0) return null;
            const order = orderRes.rows[0];

            // 2. Fetch Items
            const itemsRes = await client.query(
                `SELECT oi.*, p.name 
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = $1`,
                [orderId]
            );
            order.items = itemsRes.rows;

            return order;
        } finally {
            client.release();
        }
    }
}

module.exports = Order;
