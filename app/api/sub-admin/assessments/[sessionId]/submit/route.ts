import type { CompetencyCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { apiValidationError, handleApiError } from "@/lib/api-response";
import { auditLog, getRequestMetadata } from "@/lib/audit";
import { generateAssessmentAiReport } from "@/lib/ai-report";
import { prisma } from "@/lib/prisma";
import { requireApprovedSubAdmin } from "@/lib/sub-admin-auth";
import { updateEmployeeReport } from "@/lib/reporting";
import { computeRemark, defaultCompetencyBreakdown, roundToTwo } from "@/lib/scoring";
import { parseJsonBody, parseParams } from "@/lib/validation/parse";
import { assessmentSubmitSchema, sessionIdParamSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ sessionId: string }>;
  },
) {
  try {
    const parsedParams = parseParams(await context.params, sessionIdParamSchema);
    if (!parsedParams.success) {
      return apiValidationError(parsedParams.message, parsedParams.details);
    }
    const { sessionId } = parsedParams.data;

    const subAdmin = await requireApprovedSubAdmin(request);

    const parsedBody = await parseJsonBody(request, assessmentSubmitSchema);
    if (!parsedBody.success) {
      return apiValidationError(parsedBody.message, parsedBody.details);
    }
    const { responses } = parsedBody.data;

    const session = await prisma.assessmentSession.findFirst({
      where: {
        id: sessionId,
        subAdminId: subAdmin.id,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            department: true,
            jobRole: true,
            site: true,
          },
        },
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
      const { questionId, optionId } = item;

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
    const aiResponses: Array<{
      question: string;
      category: CompetencyCategory;
      selectedOptionText: string;
      selectedWeightLabel: string;
      selectedScore: number;
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
      aiResponses.push({
        question: sessionQuestion.question.text,
        category,
        selectedOptionText: selectedOption.text,
        selectedWeightLabel: selectedOption.weightLabel,
        selectedScore: selectedOption.score,
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

    const generatedReport = await generateAssessmentAiReport({
      employee: {
        id: session.employee.id,
        fullName: session.employee.fullName,
        department: session.employee.department,
        jobRole: session.employee.jobRole,
        site: session.employee.site,
      },
      submission: {
        id: submission.id,
        totalScore,
        remark: remarkData.remark,
        remarkScore: remarkData.remarkScore,
        submittedAt: submission.submittedAt.toISOString(),
      },
      competencyBreakdown,
      responses: aiResponses,
    });

    const aiReport = await prisma.assessmentAiReport.upsert({
      where: {
        submissionId: submission.id,
      },
      update: {
        provider: generatedReport.provider,
        model: generatedReport.model,
        report: generatedReport.report,
      },
      create: {
        submissionId: submission.id,
        employeeId: submission.employeeId,
        subAdminId: submission.subAdminId,
        provider: generatedReport.provider,
        model: generatedReport.model,
        report: generatedReport.report,
      },
    });

    auditLog({
      event: "assessment_submitted",
      actorId: subAdmin.id,
      actorRole: "sub_admin",
      metadata: {
        sessionId: session.id,
        submissionId: submission.id,
        employeeId: session.employeeId,
        totalScore,
        remarkScore: remarkData.remarkScore,
        ...getRequestMetadata(request),
      },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      aiReportId: aiReport.id,
      employeeId: submission.employeeId,
      totalScore,
      remark: remarkData.remark,
      remarkScore: remarkData.remarkScore,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Session is no longer in progress")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    return handleApiError(error, "Failed to submit assessment.", request);
  }
}
