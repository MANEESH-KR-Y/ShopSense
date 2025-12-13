const Inventory = require('../models/Inventory');

class InventoryService {
  static async updateStock(productId, quantity) {
    const existing = await Inventory.getStock(productId);

    if (!existing) {
      return await Inventory.createStock(productId, quantity);
    }

    return await Inventory.updateStock(productId, quantity);
  }

  static async getStock(productId) {
    return await Inventory.getStock(productId);
  }
}

module.exports = InventoryService;
