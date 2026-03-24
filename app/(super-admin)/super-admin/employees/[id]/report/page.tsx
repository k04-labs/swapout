import { SuperAdminEmployeeReportClient } from "@/components/super-admin/employee-report-client";

type PageParams = {
  id: string;
};

export default async function SuperAdminEmployeeReportPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;

  return <SuperAdminEmployeeReportClient employeeId={id} />;
}
