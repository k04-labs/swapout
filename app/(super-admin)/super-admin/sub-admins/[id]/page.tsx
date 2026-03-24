import { SuperAdminSubAdminDetailClient } from "@/components/super-admin/sub-admin-detail-client";

type PageParams = {
  id: string;
};

export default async function SuperAdminSubAdminDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;

  return <SuperAdminSubAdminDetailClient subAdminId={id} />;
}
