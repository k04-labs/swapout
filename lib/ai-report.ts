import type { CompetencyCategory } from "@prisma/client";
import { computeRemark, roundToTwo } from "@/lib/scoring";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type Priority = "LOW" | "MEDIUM" | "HIGH";

export type AiCategoryInsight = {
  category: CompetencyCategory;
  score: number;
  observation: string;
  recommendation: string;
};

export type AiActionPlanItem = {
  priority: Priority;
  action: string;
  rationale: string;
  timeline: string;
};

export type AiAssessmentReport = {
  generatedAt: string;
  summary: string;
  riskLevel: RiskLevel;
  overallObservations: string[];
  strengths: string[];
  improvements: string[];
  categoryInsights: AiCategoryInsight[];
  actionPlan: AiActionPlanItem[];
  coachingMessage: string;
  confidence: number;
};

export type AiAssessmentInput = {
  employee: {
    id: string;
    fullName: string;
    department: string;
    jobRole: string;
    site: string;
  };
  submission: {
    id: string;
    totalScore: number;
    remark: string;
    remarkScore: number;
    submittedAt: string;
  };
  competencyBreakdown: Record<CompetencyCategory, number>;
  responses: Array<{
    question: string;
    category: CompetencyCategory;
    selectedOptionText: string;
    selectedWeightLabel: string;
    selectedScore: number;
  }>;
};

export type GeneratedAiAssessmentReport = {
  provider: "gemini" | "fallback";
  model: string;
  report: AiAssessmentReport;
};

const DEFAULT_GEMINI_MODEL = process.env.AI_REPORT_MODEL?.trim() || "gemini-2.0-flash";

function toLabel(category: CompetencyCategory): string {
  return category.replaceAll("_", " ").toLowerCase();
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 4) return "LOW";
  if (score >= 2.8) return "MEDIUM";
  return "HIGH";
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function coercePriority(value: unknown): Priority {
  if (value === "HIGH" || value === "MEDIUM" || value === "LOW") {
    return value;
  }
  return "MEDIUM";
}

function coerceRisk(value: unknown, fallback: RiskLevel): RiskLevel {
  if (value === "LOW" || value === "MEDIUM" || value === "HIGH") {
    return value;
  }
  return fallback;
}

function buildFallbackReport(input: AiAssessmentInput): AiAssessmentReport {
  const breakdownEntries = Object.entries(input.competencyBreakdown) as Array<
    [CompetencyCategory, number]
  >;
  const sortedByScore = [...breakdownEntries].sort((a, b) => b[1] - a[1]);

  const strengths = sortedByScore
    .filter(([, score]) => score >= 3.5)
    .slice(0, 3)
    .map(([category, score]) => `${toLabel(category)} is stable at ${score.toFixed(2)}.`);

  const improvements = [...sortedByScore]
    .reverse()
    .filter(([, score]) => score < 3.3)
    .slice(0, 3)
    .map(([category, score]) => `${toLabel(category)} needs coaching (current ${score.toFixed(2)}).`);

  const categoryInsights = sortedByScore.map(([category, score]) => ({
    category,
    score: roundToTwo(score),
    observation:
      score >= 4
        ? "Consistent safe behaviour under this competency."
        : score >= 3
          ? "Baseline compliance is visible but not fully consistent."
          : "Clear behavioural gap under practical conditions.",
    recommendation:
      score >= 4
        ? "Use this competency as peer-coaching leverage."
        : score >= 3
          ? "Run short weekly reinforcement checks and scenario drills."
          : "Run immediate guided coaching with observable checkpoints.",
  }));

  const actionPlan: AiActionPlanItem[] = categoryInsights
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item, index) => ({
      priority: index === 0 ? "HIGH" : index === 1 ? "MEDIUM" : "LOW",
      action: `Improve ${toLabel(item.category)} through structured practice.`,
      rationale: item.recommendation,
      timeline: index === 0 ? "Start within 48 hours" : "Within 1-2 weeks",
    }));

  const riskLevel = riskFromScore(input.submission.totalScore);
  const remarkMeta = computeRemark(input.submission.totalScore);

  return {
    generatedAt: new Date().toISOString(),
    summary: `Assessment indicates ${remarkMeta.remark.toLowerCase()} behaviour with a ${input.submission.totalScore.toFixed(2)} score.`,
    riskLevel,
    overallObservations: [
      `Overall score: ${input.submission.totalScore.toFixed(2)} / 5`,
      `Band: ${input.submission.remark} (${input.submission.remarkScore}/5)`,
      `${input.responses.length} scored responses were evaluated.`,
    ],
    strengths:
      strengths.length > 0
        ? strengths
        : ["No strong competency outliers yet. Build consistency through repetition."],
    improvements:
      improvements.length > 0
        ? improvements
        : ["Continue reinforcement to prevent regression in upcoming assessments."],
    categoryInsights,
    actionPlan,
    coachingMessage:
      riskLevel === "HIGH"
        ? "Prioritize immediate, observable behaviour corrections and daily follow-ups."
        : riskLevel === "MEDIUM"
          ? "Focus on consistency routines and short interval coaching."
          : "Sustain habits and mentor peers using current strong behaviours.",
    confidence: 0.66,
  };
}

function extractJsonFromText(text: string): unknown {
  const direct = text.trim();
  try {
    return JSON.parse(direct);
  } catch {
    // noop
  }

  const fencedMatch = direct.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {
      return null;
    }
  }

  const firstBrace = direct.indexOf("{");
  const lastBrace = direct.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const snippet = direct.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(snippet);
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeModelReport(
  input: AiAssessmentInput,
  payload: unknown,
): AiAssessmentReport | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const fallback = buildFallbackReport(input);

  const categoryInsights = Array.isArray(value.categoryInsights)
    ? value.categoryInsights
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const item = entry as Record<string, unknown>;
          const category = item.category;
          if (
            category !== "HAZARD_RECOGNITION" &&
            category !== "INCIDENT_RESPONSE" &&
            category !== "COMPLIANCE_AWARENESS" &&
            category !== "RISK_ASSESSMENT" &&
            category !== "BEHAVIORAL_ACCOUNTABILITY"
          ) {
            return null;
          }
          return {
            category,
            score:
              typeof item.score === "number"
                ? roundToTwo(item.score)
                : fallback.categoryInsights.find((fallbackItem) => fallbackItem.category === category)?.score ?? 0,
            observation:
              typeof item.observation === "string" && item.observation.trim()
                ? item.observation.trim()
                : "No observation provided.",
            recommendation:
              typeof item.recommendation === "string" && item.recommendation.trim()
                ? item.recommendation.trim()
                : "No recommendation provided.",
          } satisfies AiCategoryInsight;
        })
        .filter((entry): entry is AiCategoryInsight => Boolean(entry))
    : [];

  const actionPlan = Array.isArray(value.actionPlan)
    ? value.actionPlan
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const item = entry as Record<string, unknown>;
          return {
            priority: coercePriority(item.priority),
            action:
              typeof item.action === "string" && item.action.trim()
                ? item.action.trim()
                : "No action provided.",
            rationale:
              typeof item.rationale === "string" && item.rationale.trim()
                ? item.rationale.trim()
                : "No rationale provided.",
            timeline:
              typeof item.timeline === "string" && item.timeline.trim()
                ? item.timeline.trim()
                : "No timeline provided.",
          } satisfies AiActionPlanItem;
        })
        .filter((entry): entry is AiActionPlanItem => Boolean(entry))
    : [];

  return {
    generatedAt: new Date().toISOString(),
    summary:
      typeof value.summary === "string" && value.summary.trim()
        ? value.summary.trim()
        : fallback.summary,
    riskLevel: coerceRisk(value.riskLevel, fallback.riskLevel),
    overallObservations:
      ensureStringArray(value.overallObservations).length > 0
        ? ensureStringArray(value.overallObservations)
        : fallback.overallObservations,
    strengths:
      ensureStringArray(value.strengths).length > 0
        ? ensureStringArray(value.strengths)
        : fallback.strengths,
    improvements:
      ensureStringArray(value.improvements).length > 0
        ? ensureStringArray(value.improvements)
        : fallback.improvements,
    categoryInsights:
      categoryInsights.length > 0 ? categoryInsights : fallback.categoryInsights,
    actionPlan: actionPlan.length > 0 ? actionPlan : fallback.actionPlan,
    coachingMessage:
      typeof value.coachingMessage === "string" && value.coachingMessage.trim()
        ? value.coachingMessage.trim()
        : fallback.coachingMessage,
    confidence:
      typeof value.confidence === "number"
        ? Math.max(0, Math.min(1, roundToTwo(value.confidence)))
        : fallback.confidence,
  };
}

async function generateWithGemini(
  input: AiAssessmentInput,
  apiKey: string,
): Promise<AiAssessmentReport | null> {
  const prompt = [
    "You are a behavioural safety analyst.",
    "Return strictly valid JSON only (no markdown, no prose).",
    "Use this exact shape:",
    JSON.stringify(
      {
        summary: "string",
        riskLevel: "LOW|MEDIUM|HIGH",
        overallObservations: ["string"],
        strengths: ["string"],
        improvements: ["string"],
        categoryInsights: [
          {
            category:
              "HAZARD_RECOGNITION|INCIDENT_RESPONSE|COMPLIANCE_AWARENESS|RISK_ASSESSMENT|BEHAVIORAL_ACCOUNTABILITY",
            score: 0,
            observation: "string",
            recommendation: "string",
          },
        ],
        actionPlan: [
          {
            priority: "HIGH|MEDIUM|LOW",
            action: "string",
            rationale: "string",
            timeline: "string",
          },
        ],
        coachingMessage: "string",
        confidence: 0.0,
      },
      null,
      2,
    ),
    "Assessment input JSON:",
    JSON.stringify(input),
  ].join("\n\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(DEFAULT_GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  const parsed = extractJsonFromText(text);
  return normalizeModelReport(input, parsed);
}

export async function generateAssessmentAiReport(
  input: AiAssessmentInput,
): Promise<GeneratedAiAssessmentReport> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey) {
    try {
      const report = await generateWithGemini(input, apiKey);
      if (report) {
        return {
          provider: "gemini",
          model: DEFAULT_GEMINI_MODEL,
          report,
        };
      }
    } catch {
      // fall through to deterministic fallback
    }
  }

  return {
    provider: "fallback",
    model: "deterministic-v1",
    report: buildFallbackReport(input),
  };
}
