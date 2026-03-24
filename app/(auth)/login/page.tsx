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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SubAdmin Sign-In</CardTitle>
            <CardDescription>
              Continue with Google to request or access your SubAdmin account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleSignInButton />
            <p className="text-xs text-slate-500">
              New accounts start in a pending state until approved by SuperAdmin.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SuperAdmin Access</CardTitle>
            <CardDescription>Use username and password credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/super-admin/login"
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              Go to SuperAdmin Login
            </Link>
            <p className="text-xs text-slate-500">
              This is an internal tool. No public landing page is exposed.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
