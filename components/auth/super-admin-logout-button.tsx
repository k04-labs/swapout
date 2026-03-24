"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppMutation } from "@/hooks/mutation";
import { apiClient } from "@/lib/api-client";

export function SuperAdminLogoutButton() {
  const router = useRouter();
  const logoutMutation = useAppMutation<void, void>({
    mutationKey: ["super-admin-logout"],
    mutationFn: async () => {
      await apiClient.post("/api/super-admin/auth/logout");
    },
    fallbackError: "Failed to logout.",
  });
  const isPending = logoutMutation.isPending;

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync(undefined);
    } finally {
      router.push("/super-admin/login");
      router.refresh();
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
