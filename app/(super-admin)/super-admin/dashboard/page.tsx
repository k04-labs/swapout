import { Users, Clock, UserCheck, BarChart3 } from "lucide-react";

export default function SuperAdminDashboardPage() {
  const cards = [
    {
      label: "Total SubAdmins",
      value: "0",
      icon: Users,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
      label: "Pending Approvals",
      value: "0",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Total Employees",
      value: "0",
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Platform Avg Score",
      value: "0.0 / 5",
      icon: BarChart3,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/30",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl text-foreground">Dashboard</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md ${item.bg}`}
              >
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </div>
            <p className="mt-2 font-heading text-2xl text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <div className="rounded-md border border-border bg-card p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Phase 1 Status
        </h3>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>Core auth, route guards, and data foundation are active.</p>
          <p>
            SubAdmin management, employee views, and question bank screens are
            scaffolded next.
          </p>
        </div>
      </div>
    </div>
  );
}
