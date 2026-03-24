import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSubAdminFromServer } from "@/lib/sub-admin-auth";

export default async function SubAdminRejectedPage() {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus === "APPROVED") {
    redirect("/sub-admin/dashboard");
  }

  if (subAdmin.approvalStatus === "PENDING") {
    redirect("/sub-admin/pending");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Rejected</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-600">
        <p>Your SubAdmin account was rejected by the SuperAdmin.</p>
        <p>Contact platform administration if this decision should be reviewed.</p>
      </CardContent>
    </Card>
  );
}
