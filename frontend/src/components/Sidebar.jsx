import React from "react";
import { Link, useLocation } from "react-router-dom";

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

    <aside className="w-64 bg-[var(--color-brand-surface)] border-r border-[var(--color-brand-border)] flex flex-col h-full z-20 relative">
      <div className="p-8 border-b border-[var(--color-brand-border)]">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Shop<span className="text-[var(--color-brand-blue)]">Sense</span>
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all font-medium text-sm
                ${isActive
                  ? "bg-[var(--color-brand-blue)] text-white shadow-md shadow-orange-900/10"
                  : "text-[var(--color-brand-text-muted)] hover:bg-[var(--color-brand-surface)] hover:text-white"
                }`}
            >
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}
