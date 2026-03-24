import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SubAdminLoginPage() {
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SwapOut</h1>
        </div>

        {/* Main sign-in card */}
        <Card className="w-full shadow-lg border-border/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in with your Google account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <GoogleSignInButton />
            <p className="text-center text-xs text-muted-foreground">
              New accounts require SuperAdmin approval before access is granted.
            </p>
          </CardContent>
        </Card>

        {/* Super admin link */}
        <p className="text-sm text-muted-foreground">
          Are you a Super Admin?{" "}
          <Link
            href="/super-admin/login"
            className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
