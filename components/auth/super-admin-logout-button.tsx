"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuperAdminLogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    try {
      await fetch("/api/super-admin/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/super-admin/login");
      router.refresh();
      setIsPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
