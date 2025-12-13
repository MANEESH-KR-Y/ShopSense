const router = require('express').Router();
const auth = require('../middleware/auth');
const inventoryController = require('../controllers/inventoryController');

// Update stock
router.post('/update', auth.verifyToken, inventoryController.updateStock);

// Get stock by product
router.get('/:productId', auth.verifyToken, inventoryController.getStock);

module.exports = router;
