import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SuperAdminLogoutButton } from "@/components/auth/super-admin-logout-button";
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
      subtitle="Platform governance, approvals, and oversight"
      roleLabel="SuperAdmin"
      actions={<SuperAdminLogoutButton />}
      navItems={[
        { label: "Dashboard", href: "/super-admin/dashboard" },
        { label: "SubAdmins", href: "/super-admin/sub-admins", disabled: true },
        { label: "Employees", href: "/super-admin/employees", disabled: true },
        { label: "Questions", href: "/super-admin/questions", disabled: true },
      ]}
    >
      {children}
    </AppShell>
  );
}
