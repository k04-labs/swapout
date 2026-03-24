import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubAdminFromServer, getSubAdminRedirect } from "@/lib/sub-admin-auth";

export default async function SubAdminDashboardPage() {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus !== "APPROVED") {
    redirect(getSubAdminRedirect(subAdmin.approvalStatus));
  }

  const cards = [
    { label: "Total Employees", value: "0" },
    { label: "Assessments Submitted", value: "0" },
    { label: "Average Employee Score", value: "0.0 / 5" },
    { label: "No Recent Assessment", value: "0" },
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
          <CardTitle>Ready for Phase 2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Employee CRUD and assessment flows plug into this dashboard next.</p>
          <p>Auth and approval gating are active for all SubAdmin routes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
