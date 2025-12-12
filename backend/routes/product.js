const router = require("express").Router();
const auth = require("../middleware/auth");
const productController = require("../controllers/productController");

router.post("/", auth.verifyToken, productController.createProduct);
router.get("/", auth.verifyToken, productController.getProducts);
router.put("/:id", auth.verifyToken, productController.updateProduct);
router.delete("/:id", auth.verifyToken, productController.deleteProduct);

// Helper to get all categories
router.get("/categories", auth.verifyToken, async (req, res) => {
    try {
        const result = await require("../db").query("SELECT * FROM categories ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

module.exports = router;
