import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireSuperAdmin } from "@/lib/super-admin-auth";

export default async function SuperAdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/super-admin/login");
  }

  return (
    <AppShell
      title="SuperAdmin Control Center"
      roleLabel="SuperAdmin"
      userName="SuperAdmin"
      logoutEndpoint="/api/super-admin/auth/logout"
      logoutRedirect="/super-admin/login"
      settingsHref="/super-admin/dashboard"
      navItems={[
        {
          label: "Dashboard",
          href: "/super-admin/dashboard",
          icon: "LayoutDashboard",
        },
        {
          label: "SubAdmins",
          href: "/super-admin/sub-admins",
          icon: "Users",
          disabled: true,
        },
        {
          label: "Employees",
          href: "/super-admin/employees",
          icon: "UserCheck",
          disabled: true,
        },
        {
          label: "Questions",
          href: "/super-admin/questions",
          icon: "FileText",
          disabled: true,
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
