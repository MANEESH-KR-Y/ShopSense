import React from "react";
import { Link, useLocation } from "react-router-dom";
import InstallPWA from "./InstallPWA";

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { name: "Billing", path: "/billing" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Products", path: "/inventory/products" },
    { name: "Add Product", path: "/inventory/add" },
    { name: "Analytics", path: "/analytics" },
    { name: "Profile", path: "/profile" }
  ];

  return (

    <aside className="w-64 glass-panel border-r-0 m-4 rounded-[var(--radius-card)] flex flex-col z-20 relative overflow-hidden backdrop-blur-2xl">
      <div className="p-8 border-b border-white/10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[var(--color-brand-blue)] bg-clip-text text-transparent tracking-wide">
          ShopSense
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 text-md">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all font-bold text-sm tracking-wide
                ${isActive
                  ? "bg-[var(--color-brand-blue)] text-white shadow-lg shadow-indigo-500/30 scale-105"
                  : "text-[var(--color-brand-text-muted)] hover:bg-white/5 hover:text-white"
                }`}
            >
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* PWA Install Widget */}
      <div className="p-4 mt-auto border-t border-white/10">
        <InstallPWA />
      </div>
    </aside>
  );
}
