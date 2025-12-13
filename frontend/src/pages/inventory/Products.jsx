import React, { useEffect, useState, useCallback } from "react";
import { productAPI } from "../../services/inventoryApi";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  // Define with useCallback to keep stable identity
  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await productAPI.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  }, []); // No deps as productAPI is external

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productAPI.deleteProduct(id);
        fetchProducts(); // Refresh list
      } catch (err) {
        console.error("Failed to delete", err);
        const msg = err.response?.data?.error || "Failed to delete product";
        alert(msg);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto bg-[var(--color-brand-black)] relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              📦 Product Inventory
            </h1>
            <button onClick={() => navigate('/inventory/add')} className="btn btn-primary">
              + Add New Product
            </button>
          </div>

          <div className="glass-panel overflow-hidden rounded-[var(--radius-card)] shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left p-5 text-white/50 font-bold text-xs uppercase tracking-widest">Product Name</th>
                  <th className="text-left p-5 text-white/50 font-bold text-xs uppercase tracking-widest">Category</th>
                  <th className="text-left p-5 text-white/50 font-bold text-xs uppercase tracking-widest">Unit</th>
                  <th className="text-left p-5 text-white/50 font-bold text-xs uppercase tracking-widest">Stock</th>
                  <th className="text-left p-5 text-white/50 font-bold text-xs uppercase tracking-widest">Price</th>
                  <th className="text-left p-5 text-white/50 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-5 font-bold text-white">{p.name}</td>
                    <td className="p-5 text-white/70">{p.category_name}</td>
                    <td className="p-5 font-mono text-xs text-white/50 bg-white/5 inline-block rounded my-4 ml-4 px-2 py-1">{p.unit || 'pcs'}</td>
                    <td className="p-5">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock < 10 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {p.stock} LEFT
                      </span>
                    </td>
                    <td className="p-5 text-white font-medium">₹{Number(p.price).toFixed(2)}</td>
                    <td className="p-5 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/inventory/edit/${p.id}`)}
                        className="btn btn-secondary py-1.5 px-3 text-xs">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="btn btn-danger py-1.5 px-3 text-xs">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="p-16 text-center flex flex-col items-center text-[var(--color-brand-text-muted)]">
                <span className="text-4xl mb-4 opacity-30">📦</span>
                <p className="text-lg">No products found.</p>
                <button onClick={() => navigate('/inventory/add')} className="mt-4 btn btn-primary">
                  Create First Product
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
