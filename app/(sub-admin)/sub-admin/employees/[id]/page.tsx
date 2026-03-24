import { redirect } from "next/navigation";
import { EmployeeDetailClient } from "@/components/sub-admin/employee-detail-client";
import { getSubAdminFromServer, getSubAdminRedirect } from "@/lib/sub-admin-auth";

type PageParams = {
  id: string;
};

export default async function SubAdminEmployeeDetailPage({
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

  return <EmployeeDetailClient employeeId={id} />;
}
