import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  disabled?: boolean;
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
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">SwapOut</p>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{roleLabel}</Badge>
            {actions}
          </div>
        </div>
      </header>

      {banner ? <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">{banner}</div> : null}

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 md:grid-cols-[220px_1fr] md:gap-6 md:px-6 md:py-6">
        <aside className="rounded-xl border border-slate-200 bg-white p-2">
          <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                aria-disabled={item.disabled}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors",
                  item.disabled
                    ? "pointer-events-none cursor-not-allowed bg-slate-100 text-slate-400"
                    : "hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="space-y-4">{children}</main>
      </div>
    </div>
  );
}
