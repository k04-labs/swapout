import type { QuestionOption } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";

type StartBody = {
  employeeId?: string;
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
  questionId: string;
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

export async function POST(request: Request) {
  try {
    const subAdmin = await requireApprovedSubAdmin(request);

    const body = (await request.json().catch(() => null)) as StartBody | null;
    const employeeId = typeof body?.employeeId === "string" ? body.employeeId : "";

    if (!employeeId) {
      return NextResponse.json({ message: "employeeId is required." }, { status: 400 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        subAdminId: subAdmin.id,
      },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found." }, { status: 404 });
    }

    const existingSession = await prisma.assessmentSession.findFirst({
      where: {
        employeeId,
        subAdminId: subAdmin.id,
        status: "IN_PROGRESS",
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
      orderBy: {
        startedAt: "desc",
      },
    });

    if (existingSession) {
      return NextResponse.json({
        sessionId: existingSession.id,
        employeeId,
        existingSession: true,
        questions: formatQuestions(existingSession.sessionQuestions),
      });
    }

    const activeQuestions = await prisma.question.findMany({
      where: {
        isActive: true,
      },
      include: {
        options: true,
      },
    });

    if (activeQuestions.length < 8) {
      return NextResponse.json(
        { message: "At least 8 active questions are required to start an assessment." },
        { status: 400 },
      );
    }

    const selectedQuestions = shuffle(activeQuestions).slice(0, 8);

    const session = await prisma.assessmentSession.create({
      data: {
        employeeId,
        subAdminId: subAdmin.id,
        status: "IN_PROGRESS",
        sessionQuestions: {
          create: selectedQuestions.map((question, index) => ({
            questionId: question.id,
            position: index + 1,
          })),
        },
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

    return NextResponse.json({
      sessionId: session.id,
      employeeId,
      existingSession: false,
      questions: formatQuestions(session.sessionQuestions),
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ message: error.message }, { status: (error as { status: number }).status });
    }

    return NextResponse.json({ message: "Failed to start assessment." }, { status: 500 });
  }
}
