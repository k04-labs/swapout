import type { CompetencyCategory } from "@prisma/client";

export type RemarkResult = {
  remarkScore: number;
  remark: string;
  description: string;
};

const REMARK_BANDS: Record<number, { remark: string; description: string }> = {
  1: {
    remark: "Critical Risk",
    description:
      "Fundamental safety behaviors are absent or consistently unsafe. Immediate intervention required.",
  },
  2: {
    remark: "Needs Improvement",
    description:
      "Awareness of safety protocols exists but application is inconsistent. Structured coaching needed.",
  },
  3: {
    remark: "Developing",
    description:
      "Demonstrates basic safety compliance. Inconsistencies remain in proactive behaviors.",
  },
  4: {
    remark: "Satisfactory",
    description:
      "Consistently applies safety behaviors. Shows ownership and proactive hazard identification.",
  },
  5: {
    remark: "Exemplary",
    description:
      "Champions safety culture. Coaches peers, reports near-misses, and leads by example.",
  },
};

export function getRemarkFromScoreBand(
  remarkScore: number | null | undefined,
): { remark: string; description: string } | null {
  if (!remarkScore || !REMARK_BANDS[remarkScore]) {
    return null;
  }
  return REMARK_BANDS[remarkScore];
}

export function computeRemark(totalScore: number): RemarkResult {
  if (totalScore <= 1.0) {
    return { remarkScore: 1, ...REMARK_BANDS[1] };
  }

  if (totalScore <= 2.0) {
    return { remarkScore: 2, ...REMARK_BANDS[2] };
  }

  if (totalScore <= 3.0) {
    return { remarkScore: 3, ...REMARK_BANDS[3] };
  }

  if (totalScore <= 4.0) {
    return { remarkScore: 4, ...REMARK_BANDS[4] };
  }

  return { remarkScore: 5, ...REMARK_BANDS[5] };
}

export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeTrend(scores: number[]): "improving" | "declining" | "stable" {
  if (scores.length < 3) return "stable";

  const recentSlice = scores.slice(-3);
  const previousSlice = scores.slice(-6, -3);

  const recentAverage = recentSlice.reduce((sum, current) => sum + current, 0) / recentSlice.length;

  const previousAverage =
    previousSlice.length > 0
      ? previousSlice.reduce((sum, current) => sum + current, 0) / previousSlice.length
      : recentAverage;

  if (recentAverage > previousAverage + 0.3) return "improving";
  if (recentAverage < previousAverage - 0.3) return "declining";
  return "stable";
}

export function defaultCompetencyBreakdown(): Record<CompetencyCategory, number> {
  return {
    HAZARD_RECOGNITION: 0,
    INCIDENT_RESPONSE: 0,
    COMPLIANCE_AWARENESS: 0,
    RISK_ASSESSMENT: 0,
    BEHAVIORAL_ACCOUNTABILITY: 0,
  };
}
