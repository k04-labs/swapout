import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSubAdminFromServer,
  getSubAdminRedirect,
} from "@/lib/sub-admin-auth";

export default async function SubAdminReportsPlaceholderPage() {
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
        <CardTitle>Reports Module</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Report visualizations and export surfaces are scaffolded for upcoming
        phases.
      </CardContent>
    </Card>
  );
}
