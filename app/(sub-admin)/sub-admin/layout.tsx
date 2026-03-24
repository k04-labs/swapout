import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  getSubAdminFromServer,
  getSubAdminRedirect,
} from "@/lib/sub-admin-auth";

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
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Your account is pending approval. Dashboard navigation is visible but
        locked.
      </div>
    ) : subAdmin.approvalStatus === "REJECTED" ? (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Your account access is currently rejected. Contact a SuperAdmin for
        re-approval.
      </div>
    ) : null;

  return (
    <AppShell
      title="SubAdmin Workspace"
      roleLabel="SubAdmin"
      userName={subAdmin.name}
      userEmail={subAdmin.email}
      banner={banner}
      navItems={[
        {
          label: "Dashboard",
          href: "/sub-admin/dashboard",
          icon: "LayoutDashboard",
          disabled: !isApproved,
        },
        {
          label: "Employees",
          href: "/sub-admin/employees",
          icon: "Users",
          disabled: !isApproved,
        },
        {
          label: "Reports",
          href: "/sub-admin/reports",
          icon: "FileText",
          disabled: !isApproved,
        },
        {
          label: "Settings",
          href: "/sub-admin/settings",
          icon: "Settings",
          disabled: !isApproved,
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
