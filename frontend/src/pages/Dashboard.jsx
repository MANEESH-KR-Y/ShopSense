import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import HistoryModal from "../components/HistoryModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { title: "Total Sales", value: "₹0", colorClass: "text-[var(--color-brand-blue)]" },
    { title: "Active Orders", value: "0", colorClass: "text-green-400" },
    { title: "Low Stock", value: "0", colorClass: "text-red-400" },
    { title: "Total Products", value: "0", colorClass: "text-[var(--color-brand-text)]" }
  ]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Real data fetching would go here. For now, keeping as 0 as requested.
    setLoading(false);

    // Request Notification Permission
    const requestPermission = async () => {
      try {
        const { getToken, messaging } = await import("../firebase");
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const token = await getToken(messaging, { vapidKey: "BMw5Q9yE..." }); // Need VAPID key if web push, or just default
          // console.log("Notification Token:", token);
          // In real app: api.post('/auth/device-token', { token });
        }
      } catch (err) {
        console.log("Notification permission failed", err);
      }
    };
    requestPermission();
  }, []);

  return (
    <div className="flex h-screen bg-[var(--color-brand-black)] text-[var(--color-brand-text)] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto relative bg-[var(--color-brand-black)]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>

        <header className="flex justify-between items-center mb-10 relative z-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-brand-text-muted)]">{new Date().toLocaleDateString()}</span>
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand-surface)] border border-[var(--color-brand-border)] flex items-center justify-center cursor-pointer hover:border-[var(--color-brand-blue)] transition-colors" onClick={() => navigate("/profile")}>
              <span className="font-bold text-[var(--color-brand-blue)]">A</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
          {stats.map((stat, index) => (
            <div key={index} className="card hover:border-[var(--color-brand-blue)] transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/10 group">
              <h3 className="text-[var(--color-brand-text-muted)] text-xs font-bold mb-3 uppercase tracking-widest">{stat.title}</h3>
              {loading ? (
                <div className="h-8 w-24 bg-[var(--color-brand-border)] rounded animate-pulse"></div>
              ) : (
                <p className={`text-3xl font-bold ${stat.colorClass} group-hover:scale-105 transition-transform origin-left`}>{stat.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[var(--color-brand-border)] pb-4 flex items-center justify-between">
              <span>Recent Activity</span>
              <button className="text-xs text-[var(--color-brand-blue)] hover:text-white transition-colors">View All</button>
            </h3>
            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map((_, i) => <div key={i} className="h-16 bg-[var(--color-brand-border)]/50 rounded animate-pulse"></div>)
              ) : recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-[var(--color-brand-border)] hover:border-[var(--color-brand-blue)] rounded-lg transition-all bg-[var(--color-brand-surface)]/50 hover:bg-[var(--color-brand-surface)]">
                    <div className="w-10 h-10 bg-[var(--color-brand-blue)]/20 text-[var(--color-brand-blue)] flex items-center justify-center font-bold rounded-full text-xs">
                      {item.type === "New Order" ? "ORD" : "STK"}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{item.type} <span className="text-[var(--color-brand-text-muted)]">#{item.id}</span></p>
                      <p className="text-xs text-[var(--color-brand-text-muted)]">{item.time}</p>
                    </div>
                    {item.amount && item.amount !== "-" && (
                      <span className="ml-auto font-bold text-green-400 text-sm">{item.amount}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[var(--color-brand-text-muted)]">No recent activity</div>
              )}
            </div>
          </div>

          <div className="card h-fit">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[var(--color-brand-border)] pb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate("/inventory/add")} className="btn btn-secondary py-6 flex-col gap-2 hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)] group">
                <span className="text-2xl group-hover:-translate-y-1 transition-transform">+</span>
                <span className="text-xs font-bold uppercase">Add Product</span>
              </button>
              <button onClick={() => navigate("/billing")} className="btn btn-secondary py-6 flex-col gap-2 hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)] group">
                <span className="text-2xl group-hover:-translate-y-1 transition-transform">📄</span>
                <span className="text-xs font-bold uppercase">Billing</span>
              </button>
              <button onClick={() => navigate("/analytics")} className="btn btn-secondary py-6 flex-col gap-2 hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)] group">
                <span className="text-2xl group-hover:-translate-y-1 transition-transform">📊</span>
                <span className="text-xs font-bold uppercase">Analytics</span>
              </button>
              <button onClick={() => setShowHistory(true)} className="btn btn-secondary py-6 flex-col gap-2 hover:border-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue)] group">
                <span className="text-2xl group-hover:-translate-y-1 transition-transform">📜</span>
                <span className="text-xs font-bold uppercase">Billing History</span>
              </button>
            </div>
          </div>
        </div>

        <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
      </main>
    </div>
  );
}

