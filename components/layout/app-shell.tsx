"use client";

import {
  Shield,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldAlert,
  FileText,
  Settings,
  LogOut,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  UserCheck,
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
  children: ReactNode;
  banner?: ReactNode;
  userName?: string;
  userEmail?: string;
  /** Custom logout: POST to this URL then redirect to logoutRedirect */
  logoutEndpoint?: string;
  logoutRedirect?: string;
  settingsHref?: string;
};

export function AppShell({
  title,
  roleLabel,
  navItems,
  children,
  banner,
  userName,
  userEmail,
  logoutEndpoint,
  logoutRedirect = "/login",
  settingsHref = "/sub-admin/settings",
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    setLogoutPending(true);
    try {
      if (logoutEndpoint) {
        await fetch(logoutEndpoint, { method: "POST" });
      } else {
        await signOut();
      }
    } finally {
      router.push(logoutRedirect);
      router.refresh();
      setLogoutPending(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-background">
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
          "fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border bg-card transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0 lg:z-auto",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-heading text-sm tracking-tight text-foreground">
              SwapOut
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section label */}
        <div className="px-4 pt-5 pb-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            {roleLabel}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon ? iconMap[item.icon] : undefined;

            return (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                aria-disabled={item.disabled}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors duration-100",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  item.disabled && "pointer-events-none opacity-35",
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                    strokeWidth={1.8}
                  />
                )}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge != null && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 font-mono text-[10px] font-bold text-muted-foreground">
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-colors",
                    isActive
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40 opacity-0 group-hover:opacity-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Bottom profile dropdown */}
        <div className="border-t border-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-accent/50 transition-colors outline-none">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                  {userName
                    ? userName
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                    {userName ?? "User"}
                  </p>
                  {userEmail && (
                    <p className="text-[10px] text-muted-foreground truncate leading-tight">
                      {userEmail}
                    </p>
                  )}
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-[calc(14rem-1rem)]"
            >
              <DropdownMenuItem asChild>
                <Link href={settingsHref}>
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={logoutPending}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                {logoutPending ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="font-heading text-lg text-foreground">{title}</h1>
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
