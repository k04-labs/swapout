import { redirect } from "next/navigation";
import { EmployeesClient } from "@/components/sub-admin/employees-client";
import { getSubAdminFromServer, getSubAdminRedirect } from "@/lib/sub-admin-auth";

export default async function SubAdminEmployeesPage() {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus !== "APPROVED") {
    redirect(getSubAdminRedirect(subAdmin.approvalStatus));
  }

  return <EmployeesClient />;
}
