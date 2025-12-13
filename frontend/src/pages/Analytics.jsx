import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { authAPI } from "../services/api";

export default function Analytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sales Analysis State
    const [period, setPeriod] = useState('daily');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [salesAnalysis, setSalesData] = useState(null);
    const [error, setError] = useState(null);

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

    const fetchSalesAnalysis = async () => {
        setError(null);
        console.log("Analyze clicked. Params:", { period, date, year, month });
        try {
            const queryParams = new URLSearchParams({ period, date, year, month }).toString();
            console.log("Fetching sales analysis with query:", queryParams);
            const { data } = await authAPI.getSalesAnalysis(queryParams);
            console.log("Sales Analysis Received:", data);
            setSalesData(data);
        } catch (err) {
            console.error("Analysis failed", err);
            const msg = `Failed: ${err.message}. Status: ${err.response?.status}. URL: ${err.config?.url}`;
            setError(msg);
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
                    <>
                        {error && (
                            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
                                <strong>Error:</strong> {error}
                            </div>
                        )}
                        {/* Sales Analysis Section */}
                        <div className="card mb-8 relative z-10">
                            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                                💰 Sales Analysis
                            </h2>

                            {/* Controls */}
                            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[var(--color-brand-black)] border border-[var(--color-brand-border)] rounded-lg">
                                <div className="flex gap-2">
                                    {['daily', 'monthly', 'yearly'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => { setPeriod(p); setSalesData(null); }}
                                            className={`px-4 py-2 rounded text-sm font-bold uppercase transition-all ${period === p ? 'bg-[var(--color-brand-blue)] text-white' : 'bg-gray-800 text-[var(--color-brand-text-muted)] hover:text-white'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-4 items-center">
                                    {period === 'daily' && (
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded"
                                        />
                                    )}
                                    {period === 'monthly' && (
                                        <input
                                            type="month"
                                            value={`${year}-${String(month).padStart(2, '0')}`}
                                            onChange={(e) => {
                                                const [y, m] = e.target.value.split('-');
                                                setYear(parseInt(y));
                                                setMonth(parseInt(m));
                                            }}
                                            className="bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded"
                                        />
                                    )}
                                    {period === 'yearly' && (
                                        <select
                                            value={year}
                                            onChange={(e) => setYear(parseInt(e.target.value))}
                                            className="bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded"
                                        >
                                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    )}
                                    <button onClick={fetchSalesAnalysis} className="bg-[var(--color-brand-blue)] text-white px-4 py-2 rounded font-bold hover:bg-blue-600 transition-colors">
                                        Analyze 🔎
                                    </button>
                                </div>
                            </div>

                            {/* Results */}
                            {salesAnalysis && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="p-6 bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="text-[var(--color-brand-text-muted)] text-sm uppercase">Total Revenue</p>
                                            <p className="text-3xl font-bold text-green-400">₹{parseFloat(salesAnalysis.total_sales || 0).toFixed(2)}</p>
                                        </div>
                                        <span className="text-4xl">💸</span>
                                    </div>
                                    <div className="p-6 bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="text-[var(--color-brand-text-muted)] text-sm uppercase">Total Orders</p>
                                            <p className="text-3xl font-bold text-[var(--color-brand-blue)]">{salesAnalysis.total_orders}</p>
                                        </div>
                                        <span className="text-4xl">📦</span>
                                    </div>
                                </div>
                            )}
                        </div>

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
                    </>
                )}
            </main>
        </div>
    );
}
