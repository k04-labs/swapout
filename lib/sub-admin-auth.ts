import { headers } from "next/headers";
import type { ApprovalStatus, User } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, UnauthorizedError } from "@/lib/http-errors";

export function getSubAdminRedirect(status: ApprovalStatus): string {
  if (status === "APPROVED") return "/sub-admin/dashboard";
  if (status === "REJECTED") return "/sub-admin/rejected";
  return "/sub-admin/pending";
}

async function getSessionUserIdFromHeaders(requestHeaders: Headers): Promise<string | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  const userId = session?.user?.id;

  return typeof userId === "string" ? userId : null;
}

async function getSubAdminById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function getSubAdminFromRequest(request: Request): Promise<User | null> {
  const userId = await getSessionUserIdFromHeaders(request.headers);
  if (!userId) return null;

  return getSubAdminById(userId);
}

export async function getSubAdminFromServer(): Promise<User | null> {
  const requestHeaders = await headers();
  const userId = await getSessionUserIdFromHeaders(requestHeaders);
  if (!userId) return null;

  return getSubAdminById(userId);
}

export async function requireSubAdmin(request: Request): Promise<User> {
  const subAdmin = await getSubAdminFromRequest(request);

  if (!subAdmin) {
    throw new UnauthorizedError("SubAdmin session required");
  }

  return subAdmin;
}

export async function requireApprovedSubAdmin(request: Request): Promise<User> {
  const subAdmin = await requireSubAdmin(request);

  if (subAdmin.approvalStatus !== "APPROVED") {
    throw new ForbiddenError("SubAdmin is not approved");
  }

  return subAdmin;
}
