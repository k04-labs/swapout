import { CompetencyCategory, DifficultyLevel } from "@prisma/client"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/super-admin-auth"

export const runtime = "nodejs"

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

type CreateQuestionBody = {
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
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to fetch questions." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin(request)

    const body = (await request.json().catch(() => null)) as CreateQuestionBody | null
    if (!body) {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
    }

    const text = sanitizeText(body.text)
    if (!text) {
      return NextResponse.json({ message: "Question text is required." }, { status: 400 })
    }

    if (!body.category || !Object.values(CompetencyCategory).includes(body.category)) {
      return NextResponse.json({ message: "Valid competency category is required." }, { status: 400 })
    }

    const difficulty =
      body.difficulty && Object.values(DifficultyLevel).includes(body.difficulty)
        ? body.difficulty
        : DifficultyLevel.EASY

    const options = Array.isArray(body.options)
      ? body.options.map(normalizeOption).filter(isNormalizedOption)
      : []

    if (options.length < 2) {
      return NextResponse.json(
        { message: "At least two valid options are required." },
        { status: 400 },
      )
    }

    const question = await prisma.question.create({
      data: {
        text,
        category: body.category,
        difficulty,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
        options: {
          create: options,
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

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json(
        { message: error.message },
        { status: (error as { status: number }).status },
      )
    }

    return NextResponse.json({ message: "Failed to create question." }, { status: 500 })
  }
}
