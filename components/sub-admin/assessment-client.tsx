"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Failed to start assessment.",
          );
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
    () =>
      Object.keys(answers).filter((questionId) => Boolean(answers[questionId]))
        .length,
    [answers],
  );

  async function submitAssessment() {
    if (!sessionId) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sub-admin/assessments/${sessionId}/submit`,
        {
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
        },
      );

      const payload = (await response.json()) as {
        message?: string;
        employeeId?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to submit assessment.");
      }

      router.push(`/sub-admin/employees/${payload.employeeId ?? employeeId}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit assessment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center">
        <p className="text-sm text-slate-400">
          Preparing assessment session...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200/80 bg-red-50/40 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!sessionId || questions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center">
        <p className="text-sm text-slate-400">
          No questions available for this assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl text-slate-900">Assessment</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {answeredCount} of {questions.length} questions answered
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet-50 border border-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
            {answeredCount}/{questions.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-300"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question) => {
          const isAnswered = Boolean(answers[question.questionId]);
          return (
            <div
              key={question.questionId}
              className={`rounded-xl border bg-white p-4 transition-all ${
                isAnswered ? "border-emerald-200/80" : "border-slate-200/80"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Q{question.position}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">
                  {question.category.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mb-3 text-sm font-medium text-slate-800">
                {question.text}
              </p>

              <div className="space-y-1.5">
                {question.options.map((option) => {
                  const isSelected = answers[question.questionId] === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-all ${
                        isSelected
                          ? "border-violet-200 bg-violet-50/50"
                          : "border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.questionId}`}
                        value={option.id}
                        checked={isSelected}
                        onChange={() =>
                          setAnswers((previous) => ({
                            ...previous,
                            [question.questionId]: option.id,
                          }))
                        }
                        className="mt-0.5 accent-violet-600"
                      />
                      <span className="text-sm text-slate-700">
                        {option.text}
                        <span className="ml-1.5 text-[10px] text-slate-400">
                          ({option.weightLabel})
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={submitAssessment}
        disabled={submitting || answeredCount !== questions.length}
        className="w-full sm:w-auto"
        size="sm"
      >
        {submitting ? "Submitting..." : "Submit Assessment"}
      </Button>
    </div>
  );
}
