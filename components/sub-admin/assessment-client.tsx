"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AssessmentQuestion = {
  sessionQuestionId: string;
  questionId: string;
  text: string;
  category: string;
  difficulty: string;
  position: number;
  options: Array<{
    id: string;
    text: string;
    weightLabel: string;
  }>;
};

type StartPayload = {
  message?: string;
  sessionId: string;
  employeeId: string;
  existingSession: boolean;
  questions: AssessmentQuestion[];
};

export function AssessmentClient({ employeeId }: { employeeId: string }) {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function startSession() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sub-admin/assessments/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employeeId }),
        });

        const payload = (await response.json()) as StartPayload;

        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to start assessment.");
        }

        if (mounted) {
          setSessionId(payload.sessionId);
          setQuestions(payload.questions);
        }
      } catch (sessionError) {
        if (mounted) {
          setError(sessionError instanceof Error ? sessionError.message : "Failed to start assessment.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void startSession();

    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((questionId) => Boolean(answers[questionId])).length,
    [answers],
  );

  async function submitAssessment() {
    if (!sessionId) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/sub-admin/assessments/${sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses: questions.map((question) => ({
            questionId: question.questionId,
            optionId: answers[question.questionId],
          })),
        }),
      });

      const payload = (await response.json()) as { message?: string; employeeId?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to submit assessment.");
      }

      router.push(`/sub-admin/employees/${payload.employeeId ?? employeeId}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Preparing assessment session...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!sessionId || questions.length === 0) {
    return <p className="text-sm text-slate-500">No questions available for this assessment.</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Assessment Session ({answeredCount}/{questions.length} answered)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question) => (
            <div key={question.questionId} className="rounded-lg border border-slate-200 p-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                Q{question.position} • {question.category.replaceAll("_", " ")}
              </p>
              <p className="mb-3 text-sm font-medium text-slate-900">{question.text}</p>

              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name={`question-${question.questionId}`}
                      value={option.id}
                      checked={answers[question.questionId] === option.id}
                      onChange={() =>
                        setAnswers((previous) => ({
                          ...previous,
                          [question.questionId]: option.id,
                        }))
                      }
                    />
                    <span className="text-sm text-slate-700">
                      {option.text}
                      <span className="ml-2 text-xs text-slate-500">({option.weightLabel})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <Button
            onClick={submitAssessment}
            disabled={submitting || answeredCount !== questions.length}
            className="w-full sm:w-auto"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
