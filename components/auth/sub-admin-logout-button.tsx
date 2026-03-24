"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SubAdminLogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    try {
      await signOut();
    } finally {
      router.push("/login");
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
