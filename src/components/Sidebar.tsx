"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, CalendarDays, Users, ShoppingCart,
  FileUp, BarChart3, Plug, UserCog, Settings, LogOut, Shield
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/reports", label: "Analytics", icon: BarChart3 },
  // Admin-only items below
  { href: "/import", label: "Import", icon: FileUp, adminOnly: true },
  { href: "/integrations", label: "Integrations", icon: Plug, adminOnly: true },
  { href: "/team", label: "Team", icon: UserCog, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function Sidebar({
  email,
  role,
  logoutAction,
}: {
  email: string;
  role: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-full md:w-56 bg-slate-900 text-white shrink-0 flex flex-col justify-between">
      <div>
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-sm font-black">CF</div>
            CureForever
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1 font-medium">CRM Dashboard</p>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-0.5">
          {/* Divider before admin-only section */}
          {isAdmin && (
            <>
              {/* Regular items */}
              {navItems.filter(i => !i.adminOnly).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-emerald-400" : "text-slate-500"}`} />
                    {item.label}
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </Link>
                );
              })}

              {/* Admin section divider */}
              <div className="pt-3 pb-1 px-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-slate-700/70" />
                  <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Admin
                  </span>
                  <div className="h-px flex-1 bg-slate-700/70" />
                </div>
              </div>

              {/* Admin-only items */}
              {navItems.filter(i => i.adminOnly).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-emerald-400" : "text-slate-500"}`} />
                    {item.label}
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </Link>
                );
              })}
            </>
          )}

          {/* Agent-only view: simplified nav, no admin items */}
          {!isAdmin && visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-emerald-400" : "text-slate-500"}`} />
                {item.label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Logout */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isAdmin ? "bg-emerald-600" : "bg-blue-600"
          }`}>
            {email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-300 truncate">{email}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              isAdmin ? "text-emerald-500" : "text-blue-400"
            }`}>
              {isAdmin ? "Admin" : "Agent"}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-red-400 transition-colors w-full">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
