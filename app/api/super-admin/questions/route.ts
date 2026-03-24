import { CompetencyCategory } from "@prisma/client"
import { NextResponse } from "next/server"
import { apiValidationError, handleApiError } from "@/lib/api-response"
import { auditLog, getRequestMetadata } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin-auth"
import { parseJsonBody } from "@/lib/validation/parse"
import { questionCreateSchema } from "@/lib/validation/schemas"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"
    const category = searchParams.get("category")

    const questions = await prisma.question.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(category && Object.values(CompetencyCategory).includes(category as CompetencyCategory)
          ? { category: category as CompetencyCategory }
          : {}),
      },
      include: {
        options: {
          orderBy: {
            score: "asc",
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ questions })
  } catch (error) {
    return handleApiError(error, "Failed to fetch questions.", request)
  }
}

export async function POST(request: Request) {
  try {
    const superAdmin = await requireSuperAdmin(request)

    const parsedBody = await parseJsonBody(request, questionCreateSchema)
    if (!parsedBody.success) {
      return apiValidationError(parsedBody.message, parsedBody.details)
    }

    const body = parsedBody.data

    const question = await prisma.question.create({
      data: {
        text: body.text,
        category: body.category,
        difficulty: body.difficulty,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
        options: {
          create: body.options,
        },
      },
      include: {
        options: {
          orderBy: {
            score: "asc",
          },
        },
      },
    })

    auditLog({
      event: "question_created",
      actorId: superAdmin.superAdminId,
      actorRole: "super_admin",
      metadata: {
        questionId: question.id,
        category: question.category,
        difficulty: question.difficulty,
        optionCount: question.options.length,
        ...getRequestMetadata(request),
      },
    })

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "Failed to create question.", request)
  }
}
