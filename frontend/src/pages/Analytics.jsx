import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { authAPI } from "../services/api";

export default function Analytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await authAPI.getAnalytics();
            setStats(data);
        } catch (err) {
            console.error("Failed to load stats", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto relative bg-[var(--color-brand-black)]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>

                <h1 className="text-3xl font-bold mb-8 text-white border-b border-[var(--color-brand-border)] pb-4 relative z-10 flex justify-between items-center">
                    <span>Analytics & Inventory Health</span>
                    <button onClick={() => window.location.href = '/analytics/report'} className="bg-[var(--color-brand-blue)] hover:bg-blue-600 text-white text-sm px-4 py-2 rounded uppercase font-bold transition-colors">
                        📄 Print GST Report
                    </button>
                </h1>

                {loading ? (
                    <div className="text-[var(--color-brand-text-muted)]">Loading analysis...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">

                        {/* Top Selling */}
                        <div className="card">
                            <h2 className="text-xl font-bold text-green-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                                🔥 Top Selling Products
                            </h2>
                            {stats?.topSelling?.length > 0 ? (
                                <ul className="space-y-4">
                                    {stats.topSelling.map((item, i) => (
                                        <li key={i} className="flex justify-between items-center p-3 bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] rounded hover:border-green-500/50 transition-colors">
                                            <span className="font-bold text-white">#{i + 1} {item.name}</span>
                                            <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold">{item.total_sold} SOLD</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[var(--color-brand-text-muted)]">No sales data yet.</p>
                            )}
                        </div>

                        {/* Low Selling */}
                        <div className="card">
                            <h2 className="text-xl font-bold text-blue-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                                ❄️ Low Selling Products
                            </h2>
                            {stats?.lowSelling?.length > 0 ? (
                                <ul className="space-y-4">
                                    {stats.lowSelling.map((item, i) => (
                                        <li key={i} className="flex justify-between items-center p-3 bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] rounded hover:border-blue-500/50 transition-colors">
                                            <span className="font-bold text-white">{item.name}</span>
                                            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">{item.total_sold} SOLD</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[var(--color-brand-text-muted)]">No data.</p>
                            )}
                        </div>

                        {/* Low Stock Alerts */}
                        <div className="card lg:col-span-2 border-red-900/30 bg-red-900/5">
                            <h2 className="text-xl font-bold text-red-500 mb-6 uppercase tracking-wider flex items-center gap-2">
                                ⚠️ Low Stock Alerts (Refill Needed)
                            </h2>
                            {stats?.lowStock?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {stats.lowStock.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-[var(--color-brand-black)] border border-red-500/30 rounded hover:bg-red-900/10 transition-colors">
                                            <div>
                                                <p className="font-bold text-white">{item.name}</p>
                                                <p className="text-xs text-[var(--color-brand-text-muted)]">ID: #{item.id}</p>
                                            </div>
                                            <span className="text-2xl font-bold text-red-500">{item.stock} LEFT</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-center font-bold">
                                    All systems operational. No low stock items.
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
}
