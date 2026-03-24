import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubAdminFromServer, getSubAdminRedirect } from "@/lib/sub-admin-auth";

export default async function SubAdminEmployeesPlaceholderPage() {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus !== "APPROVED") {
    redirect(getSubAdminRedirect(subAdmin.approvalStatus));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employees Module</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        Employee management UI arrives in Phase 2. Route guard and shell are active.
      </CardContent>
    </Card>
  );
}
