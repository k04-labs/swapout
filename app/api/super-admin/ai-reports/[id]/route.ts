import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiValidationError, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin-auth";
import { parseJsonBody, parseParams } from "@/lib/validation/parse";
import { aiReportUpdateSchema, idParamSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    await requireSuperAdmin(request);
    const parsedParams = parseParams(await context.params, idParamSchema);
    if (!parsedParams.success) {
      return apiValidationError(parsedParams.message, parsedParams.details);
    }
    const { id } = parsedParams.data;

    const parsedBody = await parseJsonBody(request, aiReportUpdateSchema);
    if (!parsedBody.success) {
      return apiValidationError(parsedBody.message, parsedBody.details);
    }

    const body = parsedBody.data;

    const updated = await prisma.assessmentAiReport.update({
      where: { id },
      data: {
        report: body.report as Prisma.InputJsonValue,
        ...(typeof body.provider === "string" ? { provider: body.provider.trim() || "manual-edit" } : {}),
        ...(typeof body.model === "string" ? { model: body.model.trim() || "manual-edit" } : {}),
      },
    });

    return NextResponse.json({
      report: {
        id: updated.id,
        provider: updated.provider,
        model: updated.model,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        report: updated.report,
      },
    });
  } catch (error) {
    return handleApiError(error, "Failed to update AI report.", request);
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    await requireSuperAdmin(request);
    const parsedParams = parseParams(await context.params, idParamSchema);
    if (!parsedParams.success) {
      return apiValidationError(parsedParams.message, parsedParams.details);
    }
    const { id } = parsedParams.data;

    await prisma.assessmentAiReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete AI report.", request);
  }
}
