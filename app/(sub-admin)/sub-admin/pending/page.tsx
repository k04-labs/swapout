import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getSubAdminFromServer } from "@/lib/sub-admin-auth";

export default async function SubAdminPendingPage() {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus === "APPROVED") {
    redirect("/sub-admin/dashboard");
  }

  if (subAdmin.approvalStatus === "REJECTED") {
    redirect("/sub-admin/rejected");
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800">
        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="font-heading text-xl text-foreground">Pending Approval</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your account is registered and waiting for SuperAdmin approval.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button
          disabled
          className="h-9 rounded-md border border-border bg-muted text-xs font-medium text-muted-foreground"
        >
          Add Employee (Locked)
        </button>
        <button
          disabled
          className="h-9 rounded-md border border-border bg-muted text-xs font-medium text-muted-foreground"
        >
          Start Assessment (Locked)
        </button>
      </div>
    </div>
  );
}
