"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

type SettingsClientProps = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export function SettingsClient({ user }: SettingsClientProps) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await authClient.updateUser({ name });

      if (updateError) {
        throw new Error(updateError.message ?? "Failed to update profile.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-medium text-foreground">Profile</h3>
          <p className="text-xs text-muted-foreground">Manage your account information</p>
        </div>
        <div className="p-5">
          <form onSubmit={onSubmit} className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
              />
              <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
            </div>

            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            {success && <p className="text-xs text-emerald-600 dark:text-emerald-400">Profile updated successfully.</p>}

            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>

      {/* Appearance section */}
      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-medium text-foreground">Appearance</h3>
          <p className="text-xs text-muted-foreground">Customize the look and feel</p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex h-20 w-28 flex-col items-center justify-center rounded-md border-2 p-2 text-xs font-medium transition-colors ${
                theme === "light"
                  ? "border-primary bg-card text-foreground"
                  : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50"
              }`}
            >
              <div className="mb-1.5 flex gap-0.5">
                <div className="h-3 w-5 rounded-sm bg-white border border-slate-200 dark:border-zinc-600" />
                <div className="h-3 w-8 rounded-sm bg-slate-100 dark:bg-zinc-700" />
              </div>
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex h-20 w-28 flex-col items-center justify-center rounded-md border-2 p-2 text-xs font-medium transition-colors ${
                theme === "dark"
                  ? "border-primary bg-card text-foreground"
                  : "border-border bg-muted/50 text-muted-foreground hover:border-primary/50"
              }`}
            >
              <div className="mb-1.5 flex gap-0.5">
                <div className="h-3 w-5 rounded-sm bg-zinc-800 border border-zinc-600" />
                <div className="h-3 w-8 rounded-sm bg-zinc-700" />
              </div>
              Dark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
