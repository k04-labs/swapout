"use client";

import {
  Shield,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  Users,
  ShieldAlert,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FileText,
  Settings,
};

type NavItem = {
  label: string;
  href: string;
  icon?: string;
  disabled?: boolean;
  badge?: number | string | null;
};

type AppShellProps = {
  title: string;
  subtitle?: string;
  roleLabel: string;
  navItems: NavItem[];
  actions?: ReactNode;
  children: ReactNode;
  banner?: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  roleLabel,
  navItems,
  actions,
  children,
  banner,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0 lg:z-auto",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-heading text-sm tracking-tight text-slate-800">
              SwapOut
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role pill */}
        <div className="px-3 pt-4 pb-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-700 border border-violet-100">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            {roleLabel}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/")) ||
              (item.href === "/sub-admin/dashboard" &&
                pathname === "/sub-admin/dashboard");
            const Icon = item.icon ? iconMap[item.icon] : undefined;

            return (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                aria-disabled={item.disabled}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                  item.disabled && "pointer-events-none opacity-35",
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-violet-600"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                )}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge != null && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-100 px-1 font-mono text-[10px] font-bold text-violet-700">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="h-3 w-3 text-violet-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user section */}
        <div className="border-t border-slate-200/80 p-3">
          {subtitle && (
            <p className="mb-2 px-2 text-[11px] text-slate-400 truncate">
              {subtitle}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="font-heading text-lg text-slate-900">{title}</h1>
          </div>
        </header>

        {/* Banner */}
        {banner && <div className="px-4 pt-4 lg:px-6">{banner}</div>}

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6 space-y-5">
          {children}
        </main>
      </div>
    </div>
  );
}
