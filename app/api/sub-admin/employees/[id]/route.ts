import { NextResponse } from "next/server";
import { apiValidationError, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";
import { parseJsonBody, parseParams } from "@/lib/validation/parse";
import { employeeUpdateSchema, idParamSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const parsedParams = parseParams(await context.params, idParamSchema);
    if (!parsedParams.success) {
      return apiValidationError(parsedParams.message, parsedParams.details);
    }
    const { id } = parsedParams.data;

    const subAdmin = await requireApprovedSubAdmin(request);

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        subAdminId: subAdmin.id,
      },
      include: {
        report: true,
        submissions: {
          include: {
            subAdmin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    return handleApiError(error, "Failed to fetch employee.", request);
  }
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const parsedParams = parseParams(await context.params, idParamSchema);
    if (!parsedParams.success) {
      return apiValidationError(parsedParams.message, parsedParams.details);
    }
    const { id } = parsedParams.data;

    const subAdmin = await requireApprovedSubAdmin(request);

    const parsedBody = await parseJsonBody(request, employeeUpdateSchema);
    if (!parsedBody.success) {
      return apiValidationError(parsedBody.message, parsedBody.details);
    }

    const existing = await prisma.employee.findFirst({
      where: {
        id,
        subAdminId: subAdmin.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    const updates = parsedBody.data;

    const employee = await prisma.employee.update({
      where: { id: existing.id },
      data: updates,
      include: {
        report: true,
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    return handleApiError(error, "Failed to update employee.", request);
  }
}
