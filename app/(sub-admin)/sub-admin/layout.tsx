import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SubAdminLogoutButton } from "@/components/auth/sub-admin-logout-button";
import { Badge } from "@/components/ui/badge";
import { getSubAdminFromServer, getSubAdminRedirect } from "@/lib/sub-admin-auth";

export default async function SubAdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  const isApproved = subAdmin.approvalStatus === "APPROVED";

  const banner =
    subAdmin.approvalStatus === "PENDING" ? (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Your account is pending approval. Dashboard navigation is visible but locked.
      </div>
    ) : subAdmin.approvalStatus === "REJECTED" ? (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Your account access is currently rejected. Contact a SuperAdmin for re-approval.
      </div>
    ) : null;

  const statusVariant =
    subAdmin.approvalStatus === "APPROVED"
      ? "success"
      : subAdmin.approvalStatus === "PENDING"
        ? "warning"
        : "danger";

  return (
    <AppShell
      title="SubAdmin Workspace"
      subtitle={`Welcome, ${subAdmin.name}`}
      roleLabel="SubAdmin"
      actions={
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{subAdmin.approvalStatus}</Badge>
          <SubAdminLogoutButton />
        </div>
      }
      banner={banner}
      navItems={[
        { label: "Dashboard", href: "/sub-admin/dashboard", disabled: !isApproved },
        { label: "Employees", href: "/sub-admin/employees", disabled: !isApproved },
        {
          label: isApproved ? "Status" : "Pending Status",
          href: getSubAdminRedirect(subAdmin.approvalStatus),
          disabled: false,
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
