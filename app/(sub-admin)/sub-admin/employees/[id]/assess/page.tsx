import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssessmentClient } from "@/components/sub-admin/assessment-client";
import { getSubAdminFromServer, getSubAdminRedirect } from "@/lib/sub-admin-auth";

type PageParams = {
  id: string;
};

export default async function SubAdminEmployeeAssessPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
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
        <CardTitle>Submit Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <AssessmentClient employeeId={id} />
      </CardContent>
    </Card>
  );
}
