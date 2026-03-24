import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/sub-admin/settings-client";
import {
  getSubAdminFromServer,
  getSubAdminRedirect,
} from "@/lib/sub-admin-auth";

export default async function SubAdminSettingsPage() {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus !== "APPROVED") {
    redirect(getSubAdminRedirect(subAdmin.approvalStatus));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl text-foreground">Settings</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your profile and preferences.
        </p>
      </div>
      <SettingsClient
        user={{
          id: subAdmin.id,
          name: subAdmin.name,
          email: subAdmin.email,
          image: subAdmin.image,
        }}
      />
    </div>
  );
}
