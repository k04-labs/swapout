import type { QuestionOption } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";

type Params = {
  sessionId: string;
};

function shuffle<T>(input: T[]): T[] {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

type SessionQuestionView = {
  id: string;
  position: number;
  question: {
    id: string;
    text: string;
    category: string;
    difficulty: string;
    options: QuestionOption[];
  };
};

function formatQuestions(sessionQuestions: SessionQuestionView[]) {
  return sessionQuestions
    .sort((a, b) => a.position - b.position)
    .map((sessionQuestion) => ({
      sessionQuestionId: sessionQuestion.id,
      questionId: sessionQuestion.question.id,
      text: sessionQuestion.question.text,
      category: sessionQuestion.question.category,
      difficulty: sessionQuestion.question.difficulty,
      position: sessionQuestion.position,
      options: shuffle(sessionQuestion.question.options).map((option) => ({
        id: option.id,
        text: option.text,
        weightLabel: option.weightLabel,
      })),
    }));
}

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: {
    params: Promise<Params>;
  },
) {
  try {
    const { sessionId } = await context.params;
    const subAdmin = await requireApprovedSubAdmin(request);

    const session = await prisma.assessmentSession.findFirst({
      where: {
        id: sessionId,
        subAdminId: subAdmin.id,
      },
      include: {
        sessionQuestions: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Assessment session not found." }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      employeeId: session.employeeId,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      questions: formatQuestions(session.sessionQuestions),
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ message: error.message }, { status: (error as { status: number }).status });
    }

    return NextResponse.json({ message: "Failed to fetch assessment session." }, { status: 500 });
  }
}
