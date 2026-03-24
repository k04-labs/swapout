import { NextResponse } from "next/server"
import { apiValidationError, handleApiError } from "@/lib/api-response"
import { auditLog, getRequestMetadata } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin-auth"
import { parseJsonBody, parseParams } from "@/lib/validation/parse"
import { idParamSchema, questionUpdateSchema } from "@/lib/validation/schemas"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>
  },
) {
  try {
    const superAdmin = await requireSuperAdmin(request)

    const parsedParams = parseParams(await context.params, idParamSchema)
    if (!parsedParams.success) {
      return apiValidationError(parsedParams.message, parsedParams.details)
    }
    const { id } = parsedParams.data

    const parsedBody = await parseJsonBody(request, questionUpdateSchema)
    if (!parsedBody.success) {
      return apiValidationError(parsedBody.message, parsedBody.details)
    }

    const existing = await prisma.question.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ message: "Question not found." }, { status: 404 })
    }

    const body = parsedBody.data

    if (body.options) {
      const existingResponses = await prisma.assessmentResponse.count({
        where: {
          questionId: id,
        },
      })

      if (existingResponses > 0) {
        return NextResponse.json(
          {
            message:
              "This question already has assessment history. Option changes are locked to preserve scoring integrity.",
          },
          { status: 409 },
        )
      }
    }

    const question = await prisma.$transaction(async (tx) => {
      const updatedQuestion = await tx.question.update({
        where: { id },
        data: {
          ...(body.text !== undefined ? { text: body.text } : {}),
          ...(body.category !== undefined ? { category: body.category } : {}),
          ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
          ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
        },
      })

      if (body.options) {
        await tx.questionOption.deleteMany({
          where: {
            questionId: id,
          },
        })

        await tx.questionOption.createMany({
          data: body.options.map((option) => ({
            questionId: id,
            text: option.text,
            score: option.score,
            weightLabel: option.weightLabel,
          })),
        })
      }

      return tx.question.findUnique({
        where: {
          id: updatedQuestion.id,
        },
        include: {
          options: {
            orderBy: {
              score: "asc",
            },
          },
        },
      })
    })

    auditLog({
      event: "question_updated",
      actorId: superAdmin.superAdminId,
      actorRole: "super_admin",
      metadata: {
        questionId: id,
        updatedFields: Object.keys(body),
        ...getRequestMetadata(request),
      },
    })

    return NextResponse.json({ question })
  } catch (error) {
    return handleApiError(error, "Failed to update question.", request)
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>
  },
) {
  try {
    const superAdmin = await requireSuperAdmin(request)

    const parsedParams = parseParams(await context.params, idParamSchema)
    if (!parsedParams.success) {
      return apiValidationError(parsedParams.message, parsedParams.details)
    }
    const { id } = parsedParams.data

    const existing = await prisma.question.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ message: "Question not found." }, { status: 404 })
    }

    const existingResponses = await prisma.assessmentResponse.count({
      where: {
        questionId: id,
      },
    })

    if (existingResponses > 0) {
      return NextResponse.json(
        {
          message:
            "This question is already used in assessments and cannot be deleted. Deactivate it instead.",
        },
        { status: 409 },
      )
    }

    await prisma.question.delete({
      where: { id },
    })

    auditLog({
      event: "question_deleted",
      actorId: superAdmin.superAdminId,
      actorRole: "super_admin",
      metadata: {
        questionId: id,
        ...getRequestMetadata(request),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "Failed to delete question.", request)
  }
}
