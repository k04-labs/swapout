import type { CompetencyCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";
import { updateEmployeeReport } from "@/lib/reporting";
import { computeRemark, defaultCompetencyBreakdown, roundToTwo } from "@/lib/scoring";

type Params = {
  sessionId: string;
};

type SubmitResponseItem = {
  questionId?: string;
  optionId?: string;
};

type SubmitBody = {
  responses?: SubmitResponseItem[];
};

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: {
    params: Promise<Params>;
  },
) {
  try {
    const { sessionId } = await context.params;
    const subAdmin = await requireApprovedSubAdmin(request);

    const body = (await request.json().catch(() => null)) as SubmitBody | null;
    const responses = body?.responses;

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json({ message: "responses are required." }, { status: 400 });
    }

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
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ message: "Assessment session not found." }, { status: 404 });
    }

    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { message: "This assessment session is already completed or inactive." },
        { status: 400 },
      );
    }

    if (responses.length !== session.sessionQuestions.length) {
      return NextResponse.json(
        { message: `All ${session.sessionQuestions.length} questions must be answered.` },
        { status: 400 },
      );
    }

    const responseByQuestion = new Map<string, { optionId: string }>();

    for (const item of responses) {
      const questionId = typeof item.questionId === "string" ? item.questionId : "";
      const optionId = typeof item.optionId === "string" ? item.optionId : "";

      if (!questionId || !optionId) {
        return NextResponse.json({ message: "Each response must include questionId and optionId." }, { status: 400 });
      }

      if (responseByQuestion.has(questionId)) {
        return NextResponse.json({ message: "Duplicate question responses are not allowed." }, { status: 400 });
      }

      responseByQuestion.set(questionId, { optionId });
    }

    const scoreValues: number[] = [];
    const competencyTotals = defaultCompetencyBreakdown();
    const competencyCounts = defaultCompetencyBreakdown();

    const responseRows: Array<{
      questionId: string;
      optionId: string;
      score: number;
    }> = [];

    for (const sessionQuestion of session.sessionQuestions) {
      const selected = responseByQuestion.get(sessionQuestion.questionId);

      if (!selected) {
        return NextResponse.json(
          { message: `Missing response for question ${sessionQuestion.questionId}.` },
          { status: 400 },
        );
      }

      const selectedOption = sessionQuestion.question.options.find((option) => option.id === selected.optionId);
      if (!selectedOption) {
        return NextResponse.json(
          { message: "One or more selected options are invalid for this session." },
          { status: 400 },
        );
      }

      scoreValues.push(selectedOption.score);

      const category = sessionQuestion.question.category as CompetencyCategory;
      competencyTotals[category] += selectedOption.score;
      competencyCounts[category] += 1;

      responseRows.push({
        questionId: sessionQuestion.questionId,
        optionId: selectedOption.id,
        score: selectedOption.score,
      });
    }

    const totalScore = roundToTwo(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length);

    const competencyBreakdown = defaultCompetencyBreakdown();
    for (const category of Object.keys(competencyBreakdown) as CompetencyCategory[]) {
      const count = competencyCounts[category];
      competencyBreakdown[category] = count > 0 ? roundToTwo(competencyTotals[category] / count) : 0;
    }

    const remarkData = computeRemark(totalScore);

    const submission = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.assessmentSession.updateMany({
        where: {
          id: session.id,
          subAdminId: subAdmin.id,
          status: "IN_PROGRESS",
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new Error("Session is no longer in progress.");
      }

      return tx.assessmentSubmission.create({
        data: {
          sessionId: session.id,
          employeeId: session.employeeId,
          subAdminId: subAdmin.id,
          totalScore,
          remark: remarkData.remark,
          remarkScore: remarkData.remarkScore,
          competencyBreakdown,
          responses: {
            create: responseRows,
          },
        },
      });
    });

    await updateEmployeeReport(session.employeeId);

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      employeeId: submission.employeeId,
      totalScore,
      remark: remarkData.remark,
      remarkScore: remarkData.remarkScore,
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ message: error.message }, { status: (error as { status: number }).status });
    }

    if (error instanceof Error && error.message.includes("Session is no longer in progress")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    return NextResponse.json({ message: "Failed to submit assessment." }, { status: 500 });
  }
}
