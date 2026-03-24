import { redirect } from "next/navigation";
import { ReportClient } from "@/components/sub-admin/report-client";
import { getSubAdminFromServer, getSubAdminRedirect } from "@/lib/sub-admin-auth";

type PageParams = {
  id: string;
};

export default async function SubAdminEmployeeReportPage({
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

  return <ReportClient employeeId={id} />;
}
