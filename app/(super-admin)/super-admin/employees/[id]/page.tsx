import { SuperAdminEmployeeDetailClient } from "@/components/super-admin/employee-detail-client";

type PageParams = {
  id: string;
};

export default async function SuperAdminEmployeeDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;

  return <SuperAdminEmployeeDetailClient employeeId={id} />;
}
