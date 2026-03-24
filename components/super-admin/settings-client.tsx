"use client";

import { Moon, Sun } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

type SuperAdminSettingsClientProps = {
  username: string;
};

export function SuperAdminSettingsClient({
  username,
}: SuperAdminSettingsClientProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profile</CardTitle>
          <CardDescription>Your SuperAdmin account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="text-xs font-medium text-muted-foreground"
              >
                Username
              </Label>
              <Input
                id="username"
                value={username}
                disabled
                className="opacity-60"
              />
              <p className="text-[10px] text-muted-foreground">
                Username is managed at the system level and cannot be changed
                here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "flex h-20 w-28 flex-col items-center justify-center rounded-md border-2 p-2 text-xs font-medium transition-colors",
                theme === "light"
                  ? "border-primary bg-accent text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40",
              )}
            >
              <Sun className="mb-1.5 size-5" />
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "flex h-20 w-28 flex-col items-center justify-center rounded-md border-2 p-2 text-xs font-medium transition-colors",
                theme === "dark"
                  ? "border-primary bg-accent text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40",
              )}
            >
              <Moon className="mb-1.5 size-5" />
              Dark
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
