import React, { useEffect, useState } from 'react';
import { productAPI } from '../../services/inventoryApi';
import Sidebar from '../../components/Sidebar';
import { useNavigate } from 'react-router-dom';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const { data } = await productAPI.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(id);
        fetchProducts(); // Refresh list
      } catch (err) {
        console.error('Failed to delete', err);
        const msg = err.response?.data?.error || 'Failed to delete product';
        alert(msg);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto bg-[var(--color-brand-black)] relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--color-brand-border)]">
            <h1 className="text-2xl font-bold text-white">Product Inventory</h1>
          </div>

          <div className="bg-[var(--color-brand-black)] border border-[var(--color-brand-border)] rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-brand-surface)] border-b border-[var(--color-brand-border)]">
                  <th className="text-left p-4 text-[var(--color-brand-text-muted)] font-bold text-xs uppercase tracking-widest border-b border-[var(--color-brand-border)]">
                    Product Name
                  </th>
                  <th className="text-left p-4 text-[var(--color-brand-text-muted)] font-bold text-xs uppercase tracking-widest border-b border-[var(--color-brand-border)]">
                    Category
                  </th>
                  <th className="text-left p-4 text-[var(--color-brand-text-muted)] font-bold text-xs uppercase tracking-widest border-b border-[var(--color-brand-border)]">
                    Unit
                  </th>
                  <th className="text-left p-4 text-[var(--color-brand-text-muted)] font-bold text-xs uppercase tracking-widest border-b border-[var(--color-brand-border)]">
                    Stock
                  </th>
                  <th className="text-left p-4 text-[var(--color-brand-text-muted)] font-bold text-xs uppercase tracking-widest border-b border-[var(--color-brand-border)]">
                    Price
                  </th>
                  <th className="text-left p-4 text-[var(--color-brand-text-muted)] font-bold text-xs uppercase tracking-widest border-b border-[var(--color-brand-border)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-brand-border)]">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[var(--color-brand-surface-hover)] transition-colors"
                  >
                    <td className="p-4">{p.name}</td>
                    <td className="p-4">{p.category_name}</td>
                    <td className="p-4 font-mono text-sm">{p.unit || 'pcs'}</td>
                    <td className="p-4">{p.stock}</td>
                    <td className="p-4">₹{Number(p.price).toFixed(2)}</td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => navigate(`/inventory/edit/${p.id}`)}
                        className="text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] font-bold text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-500 hover:text-red-400 font-bold text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="p-12 text-center text-[var(--color-brand-text-muted)]">
                No products found. Start by adding one.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
