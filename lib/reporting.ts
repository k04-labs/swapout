import type { CompetencyCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeTrend, roundToTwo } from "@/lib/scoring";

export async function updateEmployeeReport(employeeId: string) {
  const submissions = await prisma.assessmentSubmission.findMany({
    where: { employeeId },
    orderBy: { submittedAt: "asc" },
  });

  if (submissions.length === 0) {
    return null;
  }

  const scores = submissions.map((submission) => submission.totalScore);
  const latestSubmission = submissions[submissions.length - 1];

  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  const reportData = {
    totalSubmissions: submissions.length,
    latestScore: roundToTwo(latestSubmission.totalScore),
    latestRemarkScore: latestSubmission.remarkScore,
    latestRemark: latestSubmission.remark,
    averageScore: roundToTwo(averageScore),
    highestScore: roundToTwo(highestScore),
    lowestScore: roundToTwo(lowestScore),
    trend: computeTrend(scores),
    lastAssessedAt: latestSubmission.submittedAt,
  };

  return prisma.employeeReport.upsert({
    where: { employeeId },
    create: {
      employeeId,
      ...reportData,
    },
    update: reportData,
  });
}

export function normalizeCompetencyBreakdown(
  breakdown: unknown,
): Record<CompetencyCategory, number> {
  const normalized = {
    HAZARD_RECOGNITION: 0,
    INCIDENT_RESPONSE: 0,
    COMPLIANCE_AWARENESS: 0,
    RISK_ASSESSMENT: 0,
    BEHAVIORAL_ACCOUNTABILITY: 0,
  } satisfies Record<CompetencyCategory, number>;

  if (!breakdown || typeof breakdown !== "object") {
    return normalized;
  }

  for (const key of Object.keys(normalized) as CompetencyCategory[]) {
    const value = (breakdown as Record<string, unknown>)[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      normalized[key] = roundToTwo(value);
    }
  }

  return normalized;
}
