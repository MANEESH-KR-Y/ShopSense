import React, { useState, useEffect } from 'react';
import { productAPI, inventoryAPI } from '../../services/inventoryApi';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

export default function AddProduct() {
  const navigate = useNavigate();

  // State
  const [scannedItems, setScannedItems] = useState([]); // List of products to add
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch Categories on Mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await inventoryAPI.getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handleItemChange = (id, field, value) => {
    setScannedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id) => {
    setScannedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const saveAll = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate & Prepare
    const itemsToSave = scannedItems.map((item) => ({
      ...item,
      categoryId: item.categoryId || (categories.length > 0 ? categories[0].id : 1),
    }));

    const invalid = itemsToSave.find((i) => !i.name || !i.price);

    if (invalid) {
      setError('Please fill all fields (Name and Price are required).');
      setLoading(false);
      return;
    }

    try {
      // Loop save
      for (const item of itemsToSave) {
        await productAPI.addProduct({
          name: item.name,
          price: parseFloat(item.price),
          stock: parseInt(item.stock || 0),
          categoryId: parseInt(item.categoryId),
          unit: item.unit || 'pcs',
        });
      }
      setSuccess('All products saved successfully!');
      setTimeout(() => setScannedItems([]), 1000); // Clear list
    } catch (err) {
      console.error(err);
      setError('Failed to save some products.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-8 bg-[var(--color-brand-black)] relative overflow-y-auto">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>

        <div className="max-w-5xl w-full mx-auto relative z-10">
          {/* Header & Controls */}
          <div className="flex justify-between items-end mb-8 border-b-2 border-[var(--color-brand-blue)] pb-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Bulk Product Entry</h2>
              <p className="text-[var(--color-brand-text-muted)] text-sm">
                Add multiple products at once.
              </p>
            </div>
          </div>

          {/* Notifications */}
          {error && (
            <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 font-bold">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/40 border border-green-500 text-green-200 px-4 py-3 rounded mb-6 font-bold">
              {success}
            </div>
          )}

          {/* Scanned Items Table */}
          <div className="bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] rounded-lg shadow-2xl overflow-hidden min-h-[400px]">
            <div className="grid grid-cols-12 bg-[var(--color-brand-black)]/50 p-4 border-b border-[var(--color-brand-border)] text-[var(--color-brand-text-muted)] font-bold text-sm uppercase tracking-wider">
              <div className="col-span-4">Product Name</div>
              <div className="col-span-2">Unit</div>
              <div className="col-span-3">Price</div>
              <div className="col-span-2">Stock</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            <div className="divide-y divide-[var(--color-brand-border)]">
              {scannedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-[var(--color-brand-text-muted)] opacity-50">
                  <span className="text-5xl mb-4">📦</span>
                  <p>No products added yet.</p>
                  <button
                    onClick={() =>
                      setScannedItems([
                        ...scannedItems,
                        {
                          id: Date.now(),
                          name: '',
                          price: '',
                          stock: '',
                          unit: 'pcs',
                          categoryId: '',
                        },
                      ])
                    }
                    className="mt-4 text-blue-400 font-bold hover:underline"
                  >
                    + Add First Product
                  </button>
                </div>
              ) : (
                scannedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 p-4 items-center gap-4 hover:bg-[var(--color-brand-black)]/30 transition-colors"
                  >
                    <div className="col-span-4">
                      <input
                        className="w-full bg-transparent border-b border-transparent hover:border-gray-600 focus:border-[var(--color-brand-blue)] focus:outline-none text-white font-bold"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="Product Name"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        className="w-full bg-[var(--color-brand-black)] border-b border-gray-700 focus:border-[var(--color-brand-blue)] focus:outline-none text-white text-sm py-1"
                        value={item.unit || 'pcs'}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      >
                        <option value="pcs">Pcs</option>
                        <option value="kg">Kg</option>
                        <option value="g">Grams</option>
                        <option value="l">Litre</option>
                        <option value="ml">ml</option>
                        <option value="dozen">Dozen</option>
                        <option value="box">Box</option>
                        <option value="pack">Pack</option>
                      </select>
                    </div>
                    <div className="col-span-3 relative">
                      <span className="absolute left-0 text-[var(--color-brand-text-muted)]">
                        ₹
                      </span>
                      <input
                        className="w-full pl-4 bg-transparent border-b border-transparent hover:border-gray-600 focus:border-[var(--color-brand-blue)] focus:outline-none text-white"
                        value={item.price}
                        type="number"
                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        className="w-full bg-transparent border-b border-transparent hover:border-gray-600 focus:border-[var(--color-brand-blue)] focus:outline-none text-white"
                        value={item.stock}
                        type="number"
                        onChange={(e) => handleItemChange(item.id, 'stock', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-400 p-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() =>
                setScannedItems([
                  ...scannedItems,
                  { id: Date.now(), name: '', price: '', stock: '', unit: 'pcs', categoryId: '' },
                ])
              }
              className="px-6 py-3 border border-[var(--color-brand-border)] text-[var(--color-brand-text)] font-bold uppercase rounded hover:bg-[var(--color-brand-surface)] transition-all"
            >
              + Add Manually
            </button>
            <button
              onClick={saveAll}
              disabled={scannedItems.length === 0 || loading}
              className="px-8 py-3 bg-[var(--color-brand-blue)] text-white font-bold uppercase rounded shadow-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Saving...' : `Save ${scannedItems.length} Products`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
