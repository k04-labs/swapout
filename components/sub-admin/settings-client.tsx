"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

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
      setError(
        err instanceof Error ? err.message : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <div className="rounded-xl border border-slate-200/80 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-medium text-slate-800">Profile</h3>
          <p className="text-xs text-slate-400">
            Manage your account information
          </p>
        </div>
        <div className="p-5">
          <form onSubmit={onSubmit} className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-medium text-slate-600"
              >
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 border-slate-200 bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-medium text-slate-600"
              >
                Email
              </Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="h-9 border-slate-200 bg-slate-100 text-slate-500"
              />
              <p className="text-[10px] text-slate-400">
                Email cannot be changed
              </p>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
            {success && (
              <p className="text-xs text-emerald-600">
                Profile updated successfully.
              </p>
            )}

            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>
      </div>

      {/* Appearance section */}
      <div className="rounded-xl border border-slate-200/80 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-medium text-slate-800">Appearance</h3>
          <p className="text-xs text-slate-400">Customize the look and feel</p>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-20 w-28 flex-col items-center justify-center rounded-lg border-2 border-violet-500 bg-white p-2 text-xs font-medium text-slate-700 transition-colors"
            >
              <div className="mb-1.5 flex gap-0.5">
                <div className="h-3 w-5 rounded-sm bg-white border border-slate-200" />
                <div className="h-3 w-8 rounded-sm bg-slate-100" />
              </div>
              Light
            </button>
            <button
              type="button"
              disabled
              className="flex h-20 w-28 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-400 opacity-60 cursor-not-allowed transition-colors"
            >
              <div className="mb-1.5 flex gap-0.5">
                <div className="h-3 w-5 rounded-sm bg-slate-700" />
                <div className="h-3 w-8 rounded-sm bg-slate-600" />
              </div>
              Dark (Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
