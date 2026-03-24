import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";

type CreateEmployeeBody = {
  fullName?: string;
  department?: string;
  jobRole?: string;
  phoneNumber?: string;
  site?: string;
};

function sanitizeField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validateEmployeeBody(body: CreateEmployeeBody) {
  const fullName = sanitizeField(body.fullName);
  const department = sanitizeField(body.department);
  const jobRole = sanitizeField(body.jobRole);
  const phoneNumber = sanitizeField(body.phoneNumber);
  const site = sanitizeField(body.site);

  if (!fullName || !department || !jobRole || !phoneNumber || !site) {
    return { error: "All fields are required." };
  }

  return {
    data: {
      fullName,
      department,
      jobRole,
      phoneNumber,
      site,
    },
  };
}

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
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ message: error.message }, { status: (error as { status: number }).status });
    }

    return NextResponse.json({ message: "Failed to fetch employees." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const subAdmin = await requireApprovedSubAdmin(request);

    const body = (await request.json().catch(() => null)) as CreateEmployeeBody | null;
    if (!body) {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const validation = validateEmployeeBody(body);
    if ("error" in validation) {
      return NextResponse.json({ message: validation.error }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        ...validation.data,
        subAdminId: subAdmin.id,
      },
      include: {
        report: true,
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ message: error.message }, { status: (error as { status: number }).status });
    }

    return NextResponse.json({ message: "Failed to create employee." }, { status: 500 });
  }
}
