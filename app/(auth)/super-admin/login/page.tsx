import Link from "next/link";
import { SuperAdminLoginForm } from "@/components/auth/super-admin-login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SuperAdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        {/* Logo / branding */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Super Admin</h1>
        </div>

        {/* Login card */}
        <Card className="w-full shadow-lg border-border/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Admin Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <SuperAdminLoginForm />
          </CardContent>
        </Card>

        {/* Back to regular login */}
        <p className="text-sm text-muted-foreground">
          Not a Super Admin?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
          >
            Sign in with Google
          </Link>
        </p>
      </div>
    </main>
  );
}
