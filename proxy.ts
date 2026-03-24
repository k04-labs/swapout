import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SUPER_ADMIN_COOKIE } from "@/lib/super-admin-auth";

function hasSubAdminSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("better-auth"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const hasSuperAdminToken = Boolean(request.cookies.get(SUPER_ADMIN_COOKIE)?.value);

  if (pathname === "/super-admin/login" && hasSuperAdminToken) {
    return NextResponse.redirect(new URL("/super-admin/dashboard", request.url));
  }

  if (pathname.startsWith("/super-admin") && !pathname.startsWith("/super-admin/login")) {
    if (!hasSuperAdminToken) {
      return NextResponse.redirect(new URL("/super-admin/login", request.url));
    }
  }

  if (pathname.startsWith("/sub-admin")) {
    if (!hasSubAdminSessionCookie(request)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
