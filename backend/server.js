const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const inventoryRoutes = require('./routes/inventory');

const app = express();

// ---------------------------
// FIXED CORS CONFIG
// ---------------------------
const FRONTEND = process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'];

app.use(
  cors({
    origin: FRONTEND, // cors supports array
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(cookieParser());

// ---------------------------
// ROUTES
// ---------------------------
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/orders', require('./routes/order'));
app.use('/analytics', require('./routes/analytics'));
app.use('/reports', require('./routes/reports'));
app.use('/notifications', require('./routes/notifications'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'ShopSense API running!' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Connect to DB and then start server
const db = require('./db');

db.query('SELECT NOW()')
  .then(async () => {
    console.log('Database connected successfully.');

    // Auto-Run Migrations
    await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;`);
    await db.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;`);
    await db.query(
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;`
    );
    await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'pcs';`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(10);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_token TEXT;`); // Notification Token
    await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id INTEGER;`);
    await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER;`);
    await db.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id INTEGER;`);
    console.log('Schema migrations applied.');

    // Start Scheduler
    require('./cron/scheduler');

    app.listen(PORT, () => {
      console.log('Backend running on port', PORT);
      console.log('CORS allowed origin:', FRONTEND);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
