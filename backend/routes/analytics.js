const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

router.get('/stats', auth.verifyToken, async (req, res) => {
  try {
    const stats = await analyticsService.getStats(req.userId);
    res.json(stats);
  } catch (err) {
    console.error('STATS ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 4. Sales Analytics (Daily, Monthly, Yearly)
router.get('/sales', auth.verifyToken, async (req, res) => {
  try {
    const { period, date, year, month } = req.query;
    const data = await analyticsService.getSalesData(req.userId, period, date, year, month);

    if (!data) {
      return res.status(400).json({ error: 'Invalid period' });
    }
    res.json(data);
  } catch (err) {
    console.error('ANALYTICS ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

module.exports = router;
