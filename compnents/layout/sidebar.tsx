"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "🏠" },
  { name: "QR Library", href: "/dashboard/qr-codes", icon: "📚" },
  { name: "Create QR", href: "/dashboard/new", icon: "➕" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { name: "Restaurant Hub", href: "/dashboard/restaurant", icon: "🍽️" },
  { name: "Reviews", href: "/dashboard/reviews", icon: "⭐" },
  { name: "Team", href: "/dashboard/team", icon: "👥" },
  { name: "Locations", href: "/dashboard/locations", icon: "📍" },
  { name: "Billing", href: "/dashboard/billing", icon: "💳" },
  { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-lime-400">QR</span>Command
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Smart QR Infrastructure
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-lime-500 text-black shadow-lg"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>

              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-6">
        <div className="rounded-xl bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Workspace
          </p>

          <p className="mt-2 font-semibold text-white">
            QR Command
          </p>

          <p className="text-sm text-slate-400">
            Founder Account
          </p>
        </div>
      </div>
    </aside>
  );
}