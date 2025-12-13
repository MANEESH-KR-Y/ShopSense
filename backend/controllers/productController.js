const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.findAll(req.userId);
    return res.json(products);
  } catch (err) {
    console.error('GET PRODUCTS ERROR:', err);
    return res.status(500).json({ error: 'Failed to load products' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    console.log('CREATE PRODUCT BODY:', req.body);
    const { name, categoryId, price, stock, unit } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and Price are required' });
    }

    const product = await Product.create({
      name,
      categoryId: Number(categoryId) || 1,
      price: Number(price),
      stock: Number(stock) || 0,
      unit: unit || 'pcs',
      userId: req.userId,
    });

    return res.json({ message: 'Product created', product });
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, price, stock, unit } = req.body;
    const userId = req.userId;

    // Validate existence (and ownership)
    const product = await Product.findById(id, userId);
    if (!product) return res.status(404).json({ error: 'Product not found or unauthorized' });

    // Update
    await Product.update(
      id,
      {
        name,
        categoryId: Number(categoryId) || 1,
        price: Number(price),
        stock: Number(stock) || 0,
        unit: unit || 'pcs',
      },
      userId
    );

    return res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const product = await Product.findById(id, userId);
    if (!product) return res.status(404).json({ error: 'Product not found or unauthorized' });

    await Product.delete(id, userId);

    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('DELETE PRODUCT ERROR:', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
};
