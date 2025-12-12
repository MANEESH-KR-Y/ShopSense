const InventoryService = require("../services/inventoryService");

exports.updateStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const stock = await InventoryService.updateStock(productId, quantity);
    res.json({ stock });
  } catch (err) {
    console.error("Inventory update error:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
};

exports.getStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const stock = await InventoryService.getStock(productId);
    res.json({ stock });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock" });
  }
};
