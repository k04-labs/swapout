import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";

type Params = {
  id: string;
};

type UpdateEmployeeBody = {
  fullName?: string;
  department?: string;
  jobRole?: string;
  phoneNumber?: string;
  site?: string;
  isActive?: boolean;
};

function sanitizeField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: {
    params: Promise<Params>;
  },
) {
  try {
    const { id } = await context.params;
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
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ message: error.message }, { status: (error as { status: number }).status });
    }

    return NextResponse.json({ message: "Failed to fetch employee." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<Params>;
  },
) {
  try {
    const { id } = await context.params;
    const subAdmin = await requireApprovedSubAdmin(request);

    const body = (await request.json().catch(() => null)) as UpdateEmployeeBody | null;
    if (!body) {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
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

    const updates = {
      ...(body.fullName !== undefined ? { fullName: sanitizeField(body.fullName) } : {}),
      ...(body.department !== undefined ? { department: sanitizeField(body.department) } : {}),
      ...(body.jobRole !== undefined ? { jobRole: sanitizeField(body.jobRole) } : {}),
      ...(body.phoneNumber !== undefined ? { phoneNumber: sanitizeField(body.phoneNumber) } : {}),
      ...(body.site !== undefined ? { site: sanitizeField(body.site) } : {}),
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
    };

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No changes provided." }, { status: 400 });
    }

    const hasEmptyField = [
      updates.fullName,
      updates.department,
      updates.jobRole,
      updates.phoneNumber,
      updates.site,
    ].some((value) => value !== undefined && value.length === 0);

    if (hasEmptyField) {
      return NextResponse.json({ message: "All provided text fields must be non-empty." }, { status: 400 });
    }

    const employee = await prisma.employee.update({
      where: { id: existing.id },
      data: updates,
      include: {
        report: true,
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ message: error.message }, { status: (error as { status: number }).status });
    }

    return NextResponse.json({ message: "Failed to update employee." }, { status: 500 });
  }
}
