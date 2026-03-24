import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin-auth";

export default async function SuperAdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await requireSuperAdmin().catch(() => null);
  if (!session) {
    redirect("/super-admin/login");
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: {
      id: session.superAdminId,
    },
    select: {
      username: true,
    },
  });

  return (
    <AppShell
      title=""
      roleLabel="SuperAdmin"
      userName={superAdmin?.username ?? "SuperAdmin"}
      userEmail={
        superAdmin?.username
          ? `${superAdmin.username}@swapout.local`
          : undefined
      }
      logoutEndpoint="/api/super-admin/auth/logout"
      logoutRedirect="/super-admin/login"
      settingsHref="/super-admin/settings"
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
        },
        {
          label: "Employees",
          href: "/super-admin/employees",
          icon: "UserCheck",
        },
        {
          label: "Questions",
          href: "/super-admin/questions",
          icon: "FileText",
        },
        {
          label: "Settings",
          href: "/super-admin/settings",
          icon: "Settings",
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
