const db = require('../db');

class Inventory {
  static async getStock(productId) {
    const res = await db.query(`SELECT * FROM inventory WHERE product_id = $1`, [productId]);
    return res.rows[0];
  }

  static async updateStock(productId, quantity) {
    const res = await db.query(
      `UPDATE inventory
       SET quantity = $1, updated_at = NOW()
       WHERE product_id = $2
       RETURNING *`,
      [quantity, productId]
    );
    return res.rows[0];
  }

  static async createStock(productId, quantity = 0) {
    const res = await db.query(
      `INSERT INTO inventory (product_id, quantity)
       VALUES ($1, $2)
       RETURNING *`,
      [productId, quantity]
    );
    return res.rows[0];
  }
}

module.exports = Inventory;
