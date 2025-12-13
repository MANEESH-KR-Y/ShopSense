import React, { useEffect, useState } from "react";
import { inventoryAPI, productAPI } from "../../services/inventoryApi";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

export default function UpdateStock() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [stockInfo, setStockInfo] = useState(null);

  useEffect(() => {
    if (productId) {
      productAPI.getProducts().then(res => {
        const found = res.data.find(p => p.id == productId);
        setProduct(found);
      });
      inventoryAPI.getStock(productId).then(res => {
        setStockInfo(res.data);
      });
    }
  }, [productId]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.updateStock({ productId, quantity });
      navigate("/inventory/products");
    } catch (err) {
      console.error("Failed to update stock", err);
    }
  };

  if (!product) return <div className="flex h-screen bg-[var(--color-brand-black)] text-white items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
        <div className="max-w-lg w-full card shadow-2xl relative z-10">
          <h2 className="text-2xl font-bold mb-2 text-white">Update Stock</h2>
          <p className="text-[var(--color-brand-text-muted)] mb-8">Manage inventory levels</p>

          <div className="bg-[var(--color-brand-surface)] p-6 rounded-lg mb-8 border border-[var(--color-brand-border)]">
            <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
            <p className="text-[var(--color-brand-text-muted)] text-sm mb-4">Price: ₹{product.price}</p>

            <div className="flex items-center justify-between bg-[var(--color-brand-black)] p-3 rounded border border-[var(--color-brand-border)]">
              <span className="text-[var(--color-brand-text-muted)] text-sm">Current Stock</span>
              <span className="text-green-400 font-bold text-sm">
                {stockInfo?.quantity || 0} Units
              </span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={submit}>
            <div>
              <label className="block text-sm font-medium text-[var(--color-brand-text-muted)] mb-2">Set New Quantity</label>
              <input
                type="number"
                required
                className="input-field"
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <button className="w-full btn btn-primary py-3">
              Update Inventory
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
