import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { UnauthorizedError } from "@/lib/http-errors";

export const SUPER_ADMIN_COOKIE = "super_admin_token";
const SUPER_ADMIN_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 8;

type SuperAdminJwtPayload = {
  superAdminId: string;
  role: "super_admin";
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

function parseCookieHeader(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null;
  const cookiesList = cookieHeader.split(";");
  for (const cookie of cookiesList) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === key) {
      return valueParts.join("=");
    }
  }
  return null;
}

export async function createSuperAdminToken(superAdminId: string): Promise<string> {
  return new SignJWT({ superAdminId, role: "super_admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());
}

export async function verifySuperAdminToken(token: string): Promise<SuperAdminJwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());

  if (payload.role !== "super_admin" || typeof payload.superAdminId !== "string") {
    throw new UnauthorizedError("Invalid super admin token");
  }

  return {
    superAdminId: payload.superAdminId,
    role: "super_admin",
  };
}

export async function getSuperAdminSession(): Promise<SuperAdminJwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUPER_ADMIN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySuperAdminToken(token);
  } catch {
    return null;
  }
}

export async function getSuperAdminSessionFromRequest(
  request: Request,
): Promise<SuperAdminJwtPayload | null> {
  const token = parseCookieHeader(request.headers.get("cookie"), SUPER_ADMIN_COOKIE);

  if (!token) {
    return null;
  }

  try {
    return await verifySuperAdminToken(token);
  } catch {
    return null;
  }
}

export async function requireSuperAdmin(request?: Request): Promise<SuperAdminJwtPayload> {
  const session = request
    ? await getSuperAdminSessionFromRequest(request)
    : await getSuperAdminSession();

  if (!session) {
    throw new UnauthorizedError("SuperAdmin session required");
  }

  return session;
}

export function setSuperAdminCookie(response: NextResponse, token: string): void {
  response.cookies.set(SUPER_ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SUPER_ADMIN_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearSuperAdminCookie(response: NextResponse): void {
  response.cookies.set(SUPER_ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
