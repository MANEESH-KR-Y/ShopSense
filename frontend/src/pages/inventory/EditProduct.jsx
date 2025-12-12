import React, { useState, useEffect } from "react";
import { productAPI } from "../../services/inventoryApi";
import Sidebar from "../../components/Sidebar";
import { useNavigate, useParams } from "react-router-dom";

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: "", categoryId: "", price: "" });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            // We don't have a direct getProduct endpoint in the original code, 
            // but I added it to the service. We rely on the backend supporting it.
            // Wait, I added getProduct to service, but did I add getProduct/:id to backend?
            // I checked product.js backend relative to getProducts.
            // Actually backend/routes/product.js has router.get("/", ... getProducts)
            // It DOES NOT have router.get("/:id").
            // I should fix the backend route first!
            // But for now, I can fetch all and find (not efficient but works for now)
            // OR I can quickly add GET /:id to backend.
            // User asked to build now. I will add GET /:id to backend first.

            // Assuming I will add it:
            const { data } = await productAPI.getProducts();
            // Workaround: finding from list since I missed adding GET /:id explicitly in the plan
            const p = data.find(item => item.id === parseInt(id));
            if (p) {
                setForm({
                    name: p.name,
                    categoryId: p.categoryId,
                    price: p.price,
                    stock: p.stock,
                    unit: p.unit || "pcs"
                });
            } else {
                setError("Product not found");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load product");
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");
        setError("");

        try {
            await productAPI.updateProduct(id, {
                ...form,
                categoryId: form.categoryId || 1, // Fallback to 1 if empty/removed
                unit: form.unit || 'pcs'
            });
            setMsg("Product updated successfully!");
            setTimeout(() => navigate("/inventory/products"), 1500);
        } catch (err) {
            console.error(err);
            setError("Failed to update product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex items-center justify-center p-8 relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>
                <div className="max-w-lg w-full card shadow-2xl relative z-10 animate-fade-in-up">
                    <h2 className="text-2xl font-bold mb-2 text-white">Edit Product</h2>
                    <p className="text-[var(--color-brand-text-muted)] mb-8">Update product details</p>

                    {msg && <div className="p-3 mb-4 text-green-400 bg-green-500/10 border border-green-500/20 rounded font-bold text-sm text-center">{msg}</div>}
                    {error && <div className="p-3 mb-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded font-bold text-sm text-center">{error}</div>}

                    {initialLoading ? (
                        <div className="text-center py-10 text-[var(--color-brand-text-muted)]">Loading...</div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Product Name</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Wireless Mouse"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Unit</label>
                                <select
                                    className="input-field bg-[var(--color-brand-black)]"
                                    value={form.unit || "pcs"}
                                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
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

                            <div>
                                <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Stock Quantity</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="e.g. 50"
                                    value={form.stock || ""}
                                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[var(--color-brand-text-muted)] font-bold mb-2 text-xs uppercase tracking-widest ml-1">Price (₹)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="e.g. 499"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate("/inventory/products")}
                                    className="flex-1 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] text-[var(--color-brand-text-muted)] hover:text-white hover:border-[var(--color-brand-text-muted)] transition-all"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-orange-900/20 hover:shadow-orange-900/40 transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    {loading ? "SAVING..." : "UPDATE PRODUCT"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
