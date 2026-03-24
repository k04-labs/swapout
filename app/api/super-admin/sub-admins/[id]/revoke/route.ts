import { NextResponse } from "next/server"
import { apiValidationError, handleApiError } from "@/lib/api-response"
import { auditLog, getRequestMetadata } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin-auth"
import { parseParams } from "@/lib/validation/parse"
import { idParamSchema } from "@/lib/validation/schemas"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>
  },
) {
  try {
    const session = await requireSuperAdmin(request)
    const parsedParams = parseParams(await context.params, idParamSchema)
    if (!parsedParams.success) {
      return apiValidationError(parsedParams.message, parsedParams.details)
    }
    const { id } = parsedParams.data

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ message: "SubAdmin not found." }, { status: 404 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: "PENDING",
        approvedAt: null,
        approvedBy: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        approvalStatus: true,
        approvedAt: true,
        approvedBy: true,
      },
    })

    auditLog({
      event: "sub_admin_revoked_to_pending",
      actorId: session.superAdminId,
      actorRole: "super_admin",
      metadata: {
        targetSubAdminId: id,
        ...getRequestMetadata(request),
      },
    })

    return NextResponse.json({ subAdmin: user })
  } catch (error) {
    return handleApiError(error, "Failed to revoke sub-admin.", request)
  }
}
