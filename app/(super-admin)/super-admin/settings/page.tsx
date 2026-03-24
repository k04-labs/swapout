import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin-auth";
import { SuperAdminSettingsClient } from "@/components/super-admin/settings-client";

export default async function SuperAdminSettingsPage() {
  const session = await requireSuperAdmin().catch(() => null);

  if (!session) {
    redirect("/super-admin/login");
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: session.superAdminId },
    select: { username: true },
  });

  if (!superAdmin) {
    redirect("/super-admin/login");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl text-foreground">Settings</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your preferences.
        </p>
      </div>
      <SuperAdminSettingsClient username={superAdmin.username} />
    </div>
  );
}
