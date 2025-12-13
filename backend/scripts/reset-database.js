const db = require('../db');

async function resetDb() {
  try {
    console.log('Dropping all tables...');
    await db.query('DROP TABLE IF EXISTS order_items CASCADE');
    await db.query('DROP TABLE IF EXISTS orders CASCADE');
    await db.query('DROP TABLE IF EXISTS inventory CASCADE');
    await db.query('DROP TABLE IF EXISTS products CASCADE');
    await db.query('DROP TABLE IF EXISTS categories CASCADE');
    await db.query('DROP TABLE IF EXISTS users CASCADE');

    console.log('All tables dropped.');
    console.log('Re-running migration logic...');

    // We can just require the update create-tables logic or copy paste it.
    // Ideally we run the create-tables script, but that runs on import if self-executing.
    // Let's just exit and let the user run migrate, or I run migrate in next step.

    process.exit(0);
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }
}

resetDb();
