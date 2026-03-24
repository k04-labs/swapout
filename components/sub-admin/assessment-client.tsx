"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppMutation } from "@/hooks/mutation";
import { apiClient } from "@/lib/api-client";

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
  const [error, setError] = useState<string | null>(null);
  const startSessionMutation = useAppMutation<
    StartPayload,
    { employeeId: string }
  >({
    mutationKey: ["sub-admin-assessment-start", employeeId],
    mutationFn: async ({ employeeId: currentEmployeeId }) => {
      const { data } = await apiClient.post<StartPayload>(
        "/api/sub-admin/assessments/start",
        {
          employeeId: currentEmployeeId,
        },
      );
      return data;
    },
    fallbackError: "Failed to start assessment.",
    onSuccess: async (payload) => {
      setSessionId(payload.sessionId);
      setQuestions(payload.questions);
      setError(null);
    },
    onError: async (mutationError) => {
      setError(mutationError.message);
    },
  });
  const submitAssessmentMutation = useAppMutation<
    {
      message?: string;
      employeeId?: string;
    },
    {
      sessionId: string;
      responses: Array<{ questionId: string; optionId: string | undefined }>;
    }
  >({
    mutationKey: ["sub-admin-assessment-submit", employeeId],
    mutationFn: async ({ sessionId: currentSessionId, responses }) => {
      const { data } = await apiClient.post<{
        message?: string;
        employeeId?: string;
      }>(`/api/sub-admin/assessments/${currentSessionId}/submit`, {
        responses,
      });
      return data;
    },
    fallbackError: "Failed to submit assessment.",
  });
  const loading = startSessionMutation.isPending && questions.length === 0;
  const submitting = submitAssessmentMutation.isPending;
  const startSession = startSessionMutation.mutate;

  useEffect(() => {
    startSession({ employeeId });
  }, [employeeId, startSession]);

  const answeredCount = useMemo(
    () =>
      Object.keys(answers).filter((questionId) => Boolean(answers[questionId]))
        .length,
    [answers],
  );

  async function submitAssessment() {
    if (!sessionId) return;

    setError(null);

    try {
      const payload = await submitAssessmentMutation.mutateAsync({
        sessionId,
        responses: questions.map((question) => ({
          questionId: question.questionId,
          optionId: answers[question.questionId],
        })),
      });

      router.push(`/sub-admin/employees/${payload.employeeId ?? employeeId}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit assessment.",
      );
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-2 w-full" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`assessment-question-${index}`} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200/80 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!sessionId || questions.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
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
          <h2 className="font-heading text-xl text-foreground">Assessment</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {answeredCount} of {questions.length} questions answered
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
            {answeredCount}/{questions.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
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
              className={`rounded-md border bg-card p-4 transition-all ${
                isAnswered
                  ? "border-emerald-200/80 dark:border-emerald-800"
                  : "border-border"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Q{question.position}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {question.category.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mb-3 text-sm font-medium text-foreground">
                {question.text}
              </p>

              <div className="space-y-1.5">
                {question.options.map((option) => {
                  const isSelected = answers[question.questionId] === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 transition-all ${
                        isSelected
                          ? "border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/30"
                          : "border-border hover:bg-accent/50"
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
                      <span className="text-sm text-foreground">
                        {option.text}
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
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
