import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubAdminFromServer } from "@/lib/sub-admin-auth";

export default async function SubAdminPendingPage() {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus === "APPROVED") {
    redirect("/sub-admin/dashboard");
  }

  if (subAdmin.approvalStatus === "REJECTED") {
    redirect("/sub-admin/rejected");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approval</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>Your account is registered and waiting for SuperAdmin approval.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            disabled
            className="h-10 rounded-md border border-slate-200 bg-slate-100 text-slate-400"
          >
            Add Employee (Locked)
          </button>
          <button
            disabled
            className="h-10 rounded-md border border-slate-200 bg-slate-100 text-slate-400"
          >
            Start Assessment (Locked)
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
