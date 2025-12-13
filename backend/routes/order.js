const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// POST /orders - Create a new order
router.post('/', auth.verifyToken, async (req, res) => {
  const client = await require('../db').pool.connect();
  try {
    await client.query('BEGIN');

    const { customerName, totalAmount, taxAmount, items } = req.body;
    const userId = req.userId;
    const lowStockAlerts = [];

    // Create Order
    const orderRes = await client.query(
      `INSERT INTO orders (customer_name, total_amount, tax_amount, user_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [customerName, totalAmount, taxAmount || 0, userId]
    );
    const order = orderRes.rows[0];

    // Create Order Items and Update Stock
    for (const item of items) {
      // Verify product belongs to user (Security Check)
      const prodCheck = await client.query(`SELECT id FROM products WHERE id=$1 AND user_id=$2`, [
        item.productId,
        userId,
      ]);
      if (prodCheck.rows.length === 0) {
        throw new Error(`Product ${item.productId} not found or unauthorized`);
      }

      // Insert Item
      await client.query(
        `INSERT INTO order_items (order_id, product_id, price, quantity) VALUES ($1, $2, $3, $4)`,
        [order.id, item.productId, item.price, item.quantity]
      );

      // Deduct Stock and Check Level
      const stockRes = await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2 AND user_id = $3 RETURNING stock, name`,
        [item.quantity, item.productId, userId]
      );

      if (stockRes.rows.length > 0) {
        const { stock, name } = stockRes.rows[0];
        if (stock < 5) {
          lowStockAlerts.push({ name, stock });
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(order);

    // --- POST-ORDER NOTIFICATIONS ---

    const { sendNotification } = require('../services/firebaseService');

    // Fetch User's Device Token
    const userRes = await client.query('SELECT device_token FROM users WHERE id=$1', [userId]);
    const userToken = userRes.rows[0]?.device_token;

    // 1. New Order Notification
    if (userToken) {
      sendNotification(
        userToken,
        'New Order Received! 💰',
        `Order #${order.id} for ₹${totalAmount} has been placed.`
      );
    }

    // 2. Low Stock Alerts
    if (lowStockAlerts.length > 0) {
      for (const alert of lowStockAlerts) {
        const title = `⚠️ Low Stock Alert: ${alert.name}`;
        const message = `Only ${alert.stock} units remaining! Restock soon.`;

        // Save to In-App Notifications
        await client.query(
          `
                    INSERT INTO notifications (user_id, title, message, type)
                    VALUES ($1, $2, $3, 'alert')
                 `,
          [userId, title, message]
        );

        // Send Firebase Push
        if (userToken) {
          sendNotification(userToken, title, message);
        }
      }
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ORDER ERROR:', err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// GET /orders - List all orders
router.get('/', auth.verifyToken, async (req, res) => {
  try {
    const orders = await Order.findAll(req.userId);
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /orders/:id - Get specific order details
router.get('/:id', auth.verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id, req.userId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
