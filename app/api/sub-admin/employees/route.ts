import { NextResponse } from "next/server";
import { apiValidationError, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";
import { parseJsonBody } from "@/lib/validation/parse";
import { employeeCreateSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const subAdmin = await requireApprovedSubAdmin(request);

    const employees = await prisma.employee.findMany({
      where: {
        subAdminId: subAdmin.id,
      },
      include: {
        report: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    return handleApiError(error, "Failed to fetch employees.", request);
  }
}

export async function POST(request: Request) {
  try {
    const subAdmin = await requireApprovedSubAdmin(request);

    const parsedBody = await parseJsonBody(request, employeeCreateSchema);
    if (!parsedBody.success) {
      return apiValidationError(parsedBody.message, parsedBody.details);
    }

    const employee = await prisma.employee.create({
      data: {
        ...parsedBody.data,
        subAdminId: subAdmin.id,
      },
      include: {
        report: true,
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create employee.", request);
  }
}
