const db = require('../db');

exports.getStats = async (userId) => {
  // 1. Top Selling
  const topSelling = await db.query(
    `
        SELECT p.id, p.name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE p.user_id = $1
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 5
    `,
    [userId]
  );

  // 2. Low Selling
  const lowSelling = await db.query(
    `
        SELECT p.id, p.name, COALESCE(SUM(oi.quantity), 0) as total_sold
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        WHERE p.user_id = $1
        GROUP BY p.id, p.name
        ORDER BY total_sold ASC
        LIMIT 5
    `,
    [userId]
  );

  // 3. Low Stock
  const lowStock = await db.query(
    `
        SELECT * FROM products WHERE stock < 10 AND user_id = $1 ORDER BY stock ASC
    `,
    [userId]
  );

  return {
    topSelling: topSelling.rows,
    lowSelling: lowSelling.rows,
    lowStock: lowStock.rows,
  };
};

exports.getSalesData = async (userId, period, date, year, month) => {
  let query = '';
  let params = [userId];

  if (period === 'daily') {
    query = `
            SELECT 
                SUM(total_amount) as total_sales, 
                COUNT(*) as total_orders 
            FROM orders 
            WHERE user_id = $1 AND DATE(created_at) = $2
        `;
    params.push(date);
  } else if (period === 'monthly') {
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
  } else if (period === 'yearly') {
    query = `
            SELECT 
                SUM(total_amount) as total_sales, 
                COUNT(*) as total_orders 
            FROM orders 
            WHERE user_id = $1 
            AND EXTRACT(YEAR FROM created_at) = $2
        `;
    params.push(year);
  }

  if (query) {
    const result = await db.query(query, params);
    return result.rows[0] || { total_sales: 0, total_orders: 0 };
  }
  return null;
};
