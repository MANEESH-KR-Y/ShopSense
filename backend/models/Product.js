const db = require('../db');

class Product {
  static async create({ name, categoryId, price, stock, unit, userId }) {
    const result = await db.query(
      `INSERT INTO products (name, category_id, price, stock, unit, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, categoryId, price, stock || 0, unit || 'pcs', userId]
    );
    return result.rows[0];
  }

  static async findAll(userId) {
    const result = await db.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = $1 AND p.is_deleted = FALSE
       ORDER BY p.id DESC`,
      [userId]
    );
    return result.rows;
  }

  static async findById(id, userId) {
    const result = await db.query(
      `SELECT * FROM products WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE`,
      [id, userId]
    );
    return result.rows[0];
  }

  static async update(id, { name, categoryId, price, stock, unit }, userId) {
    await db.query(
      `UPDATE products SET name=$1, category_id=$2, price=$3, stock=$4, unit=$5 WHERE id=$6 AND user_id=$7`,
      [name, categoryId, price, stock, unit || 'pcs', id, userId]
    );
  }

  static async delete(id, userId) {
    // Soft delete
    await db.query(`UPDATE products SET is_deleted = TRUE WHERE id=$1 AND user_id=$2`, [
      id,
      userId,
    ]);
  }
}

module.exports = Product;
