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
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SuperAdmin Login</CardTitle>
          <CardDescription>
            Sign in with your seeded credentials to manage approvals and
            platform settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SuperAdminLoginForm />
          <p className="text-xs text-muted-foreground">
            Need SubAdmin access instead?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-700 dark:text-violet-400 hover:underline"
            >
              Go back to Google sign-in
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
