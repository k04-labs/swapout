import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminDashboardPage() {
  const cards = [
    { label: "Total SubAdmins", value: "0" },
    { label: "Pending Approvals", value: "0" },
    { label: "Total Employees", value: "0" },
    { label: "Platform Avg Score", value: "0.0 / 5" },
  ];

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Phase 1 Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Core auth, route guards, and data foundation are active.</p>
          <p>SubAdmin management, employee views, and question bank screens are scaffolded next.</p>
        </CardContent>
      </Card>
    </div>
  );
}
