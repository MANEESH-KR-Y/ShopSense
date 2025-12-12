const db = require("../db");
const bcrypt = require("bcryptjs");

class User {
  static async create({ name, email, phone, password }) {
    const hashed = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
      INSERT INTO users(name, email, phone, password)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, phone, created_at
      `,
      [name, email || null, phone || null, hashed]
    );

    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    return result.rows[0];
  }

  static async findByPhone(phone) {
    const result = await db.query(`SELECT * FROM users WHERE phone = $1`, [
      phone,
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT id, name, email, phone, created_at FROM users WHERE id=$1`,
      [id]
    );
    return result.rows[0];
  }

  static async updateRefreshToken(id, token) {
    await db.query(
      `UPDATE users SET refresh_token=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2`,
      [token, id]
    );
  }

  static async findByRefreshToken(refreshToken) {
    const result = await db.query(
      `SELECT * FROM users WHERE refresh_token=$1`,
      [refreshToken]
    );
    return result.rows[0];
  }

  static async update(id, { name, email, phone }) {
    await db.query(
      `UPDATE users SET name=$1, email=$2, phone=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$4`,
      [name, email, phone, id]
    );
  }

  static async clearRefreshToken(id) {
    await db.query(
      `UPDATE users SET refresh_token=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [id]
    );
  }

  static async comparePassword(raw, hashed) {
    return bcrypt.compare(raw, hashed);
  }

  static async updateOtp(id, otp) {
    // Expires in 10 minutes
    await db.query(
      `UPDATE users SET otp=$1, otp_expires_at=NOW() + INTERVAL '10 minutes' WHERE id=$2`,
      [otp, id]
    );
  }

  static async verifyOtp(id, otp) {
    const result = await db.query(
      `SELECT * FROM users WHERE id=$1 AND TRIM(otp)=$2 AND otp_expires_at > NOW()`,
      [id, otp.trim()]
    );
    return result.rows.length > 0;
  }

  static async clearOtp(id) {
    await db.query(`UPDATE users SET otp=NULL, otp_expires_at=NULL WHERE id=$1`, [id]);
  }

  static async updatePassword(id, hashedPassword) {
    await db.query(`UPDATE users SET password=$1 WHERE id=$2`, [hashedPassword, id]);
  }
  static async updateDeviceToken(id, token) {
    await db.query(`UPDATE users SET device_token=$1 WHERE id=$2`, [token, id]);
  }
}

module.exports = User;
