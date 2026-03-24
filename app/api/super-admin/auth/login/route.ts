import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { apiError, apiValidationError, handleApiError } from "@/lib/api-response";
import { auditLog, getRequestMetadata } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { createSuperAdminToken, setSuperAdminCookie } from "@/lib/super-admin-auth";
import { parseJsonBody } from "@/lib/validation/parse";
import { superAdminLoginSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

const SUPER_ADMIN_LOGIN_RATE_LIMIT = {
  max: 5,
  windowMs: 15 * 60 * 1000,
};

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const limit = checkRateLimit(
    `super-admin-login:${clientId}`,
    SUPER_ADMIN_LOGIN_RATE_LIMIT,
  );

  if (!limit.allowed) {
    const response = apiError(429, "Too many login attempts. Please try again later.", {
      code: "rate_limited",
      request,
    });
    response.headers.set("Retry-After", String(limit.retryAfterSec));
    return response;
  }

  const parsedBody = await parseJsonBody(request, superAdminLoginSchema);
  if (!parsedBody.success) {
    return apiValidationError(parsedBody.message, parsedBody.details);
  }

  try {
    const { username, password } = parsedBody.data;

    const admin = await prisma.superAdmin.findUnique({
      where: { username },
    });

    if (!admin) {
      auditLog({
        level: "warn",
        event: "super_admin_login_failed",
        actorRole: "super_admin",
        metadata: {
          username,
          reason: "admin_not_found",
          ...getRequestMetadata(request),
        },
      });
      return apiError(401, "Invalid credentials.", {
        code: "invalid_credentials",
      });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      auditLog({
        level: "warn",
        event: "super_admin_login_failed",
        actorId: admin.id,
        actorRole: "super_admin",
        metadata: {
          username,
          reason: "password_mismatch",
          ...getRequestMetadata(request),
        },
      });
      return apiError(401, "Invalid credentials.", {
        code: "invalid_credentials",
      });
    }

    const token = await createSuperAdminToken(admin.id);
    const response = NextResponse.json({ success: true }, { status: 200 });
    setSuperAdminCookie(response, token);

    response.headers.set("X-RateLimit-Remaining", String(limit.remaining));

    auditLog({
      event: "super_admin_login_success",
      actorId: admin.id,
      actorRole: "super_admin",
      metadata: {
        username,
        ...getRequestMetadata(request),
      },
    });

    return response;
  } catch (error) {
    return handleApiError(error, "Failed to login super admin.", request);
  }
}
