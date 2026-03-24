import { redirect } from "next/navigation";
import { ShieldX } from "lucide-react";
import { getSubAdminFromServer } from "@/lib/sub-admin-auth";

export default async function SubAdminRejectedPage() {
  const subAdmin = await getSubAdminFromServer();

  if (!subAdmin) {
    redirect("/login");
  }

  if (subAdmin.approvalStatus === "APPROVED") {
    redirect("/sub-admin/dashboard");
  }

  if (subAdmin.approvalStatus === "PENDING") {
    redirect("/sub-admin/pending");
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-100">
        <ShieldX className="h-5 w-5 text-red-500" />
      </div>
      <h2 className="font-heading text-xl text-slate-900">Access Rejected</h2>
      <p className="mt-2 text-sm text-slate-500">
        Your SubAdmin account was rejected by the SuperAdmin.
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Contact platform administration if this decision should be reviewed.
      </p>
    </div>
  );
}
