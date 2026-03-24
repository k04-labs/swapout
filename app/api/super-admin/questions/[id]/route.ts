import { CompetencyCategory, DifficultyLevel } from "@prisma/client"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin-auth"

type Params = {
  id: string
}

type QuestionOptionInput = {
  text?: string
  score?: number
  weightLabel?: string
}

type NormalizedQuestionOption = {
  text: string
  score: number
  weightLabel: string
}

type UpdateQuestionBody = {
  text?: string
  category?: CompetencyCategory
  difficulty?: DifficultyLevel
  isActive?: boolean
  options?: QuestionOptionInput[]
}

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeOption(option: QuestionOptionInput) {
  const text = sanitizeText(option.text)
  const weightLabel = sanitizeText(option.weightLabel)
  const score = typeof option.score === "number" && Number.isFinite(option.score) ? option.score : null

  if (!text || !weightLabel || score === null) return null
  if (score < 0 || score > 5) return null

  return {
    text,
    weightLabel,
    score,
  }
}

function isNormalizedOption(
  value: ReturnType<typeof normalizeOption>,
): value is NormalizedQuestionOption {
  return value !== null
}

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  context: {
    params: Promise<Params>
  },
) {
  try {
    await requireSuperAdmin(request)
    const { id } = await context.params

    const body = (await request.json().catch(() => null)) as UpdateQuestionBody | null
    if (!body) {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
    }

    const existing = await prisma.question.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ message: "Question not found." }, { status: 404 })
    }

    const updates = {
      ...(body.text !== undefined ? { text: sanitizeText(body.text) } : {}),
      ...(body.category && Object.values(CompetencyCategory).includes(body.category)
        ? { category: body.category }
        : {}),
      ...(body.difficulty && Object.values(DifficultyLevel).includes(body.difficulty)
        ? { difficulty: body.difficulty }
        : {}),
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
    }

    if (updates.text !== undefined && !updates.text) {
      return NextResponse.json({ message: "Question text cannot be empty." }, { status: 400 })
    }

    const options = Array.isArray(body.options)
      ? body.options.map(normalizeOption).filter(isNormalizedOption)
      : null
    if (options && options.length < 2) {
      return NextResponse.json(
        { message: "At least two valid options are required when updating options." },
        { status: 400 },
      )
    }

    if (options) {
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
        data: updates,
      })

      if (options) {
        await tx.questionOption.deleteMany({
          where: {
            questionId: id,
          },
        })

        await tx.questionOption.createMany({
          data: options.map((option) => ({
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

    return NextResponse.json({ question })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to update question." }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<Params>
  },
) {
  try {
    await requireSuperAdmin(request)
    const { id } = await context.params

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

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to delete question." }, { status: 500 })
  }
}
