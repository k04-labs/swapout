"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppMutation } from "@/hooks/mutation";
import { apiClient } from "@/lib/api-client";

export function SuperAdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const signinMutation = useAppMutation<
    unknown,
    { username: string; password: string }
  >({
    mutationKey: ["super-admin-signin"],
    mutationFn: async (body) => {
      const { data } = await apiClient.post("/api/super-admin/auth/login", body);
      return data;
    },
    fallbackError: "Invalid credentials",
  });
  const isPending = signinMutation.isPending;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await signinMutation.mutateAsync({ username, password });
      router.push("/super-admin/dashboard");
      router.refresh();
    } catch (signinError) {
      setError(
        signinError instanceof Error
          ? signinError.message
          : "Unable to sign in right now. Please try again.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          placeholder="superadmin"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign In
      </Button>
    </form>
  );
}
