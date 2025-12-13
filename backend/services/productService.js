const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

class ProductService {
  static async createProduct(data) {
    const product = await Product.create(data);
    await Inventory.createStock(product.id, 0);
    return product;
  }

  static async getProducts() {
    return await Product.findAll();
  }
}

module.exports = ProductService;
