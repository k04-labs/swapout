"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Save, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const FILTER_ALL = "ALL";

type Category =
  | "HAZARD_RECOGNITION"
  | "INCIDENT_RESPONSE"
  | "COMPLIANCE_AWARENESS"
  | "RISK_ASSESSMENT"
  | "BEHAVIORAL_ACCOUNTABILITY";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type QuestionOption = {
  id: string;
  text: string;
  score: number;
  weightLabel: string;
};

type Question = {
  id: string;
  text: string;
  category: Category;
  difficulty: Difficulty;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  options: QuestionOption[];
  _count?: {
    responses: number;
  };
};

type QuestionsPayload = {
  questions: Question[];
  message?: string;
};

type OptionForm = {
  text: string;
  score: string;
  weightLabel: string;
};

type QuestionForm = {
  text: string;
  category: Category;
  difficulty: Difficulty;
  isActive: boolean;
  options: OptionForm[];
};

function toCategoryLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function createInitialForm(): QuestionForm {
  return {
    text: "",
    category: "HAZARD_RECOGNITION",
    difficulty: "EASY",
    isActive: true,
    options: [
      { text: "", score: "0", weightLabel: "Never" },
      { text: "", score: "5", weightLabel: "Always" },
    ],
  };
}

function QuestionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3 w-72" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={"question-row-" + index} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function SuperAdminQuestionsClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof FILTER_ALL | "ACTIVE" | "INACTIVE">(FILTER_ALL);
  const [categoryFilter, setCategoryFilter] = useState<typeof FILTER_ALL | Category>(FILTER_ALL);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<QuestionForm>(createInitialForm());

  const editingQuestion = editingId ? questions.find((question) => question.id === editingId) ?? null : null;
  const optionsLocked = editingQuestion ? (editingQuestion._count?.responses ?? 0) > 0 : false;

  async function loadQuestions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/super-admin/questions?includeInactive=true", {
        cache: "no-store",
      });
      const payload = (await response.json()) as QuestionsPayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load questions.");
      }

      setQuestions(payload.questions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQuestions();
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (statusFilter === "ACTIVE" && !question.isActive) return false;
      if (statusFilter === "INACTIVE" && question.isActive) return false;
      if (categoryFilter !== FILTER_ALL && question.category !== categoryFilter) return false;

      const normalized = search.trim().toLowerCase();
      if (normalized.length === 0) return true;

      return (
        question.text.toLowerCase().includes(normalized) ||
        question.options.some((option) => option.text.toLowerCase().includes(normalized))
      );
    });
  }, [questions, statusFilter, categoryFilter, search]);

  function startCreate() {
    setEditingId(null);
    setForm(createInitialForm());
    setFormError(null);
    setFormOpen(true);
  }

  function startEdit(question: Question) {
    setEditingId(question.id);
    setForm({
      text: question.text,
      category: question.category,
      difficulty: question.difficulty,
      isActive: question.isActive,
      options: question.options.map((option) => ({
        text: option.text,
        score: option.score.toString(),
        weightLabel: option.weightLabel,
      })),
    });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setEditingId(null);
    setForm(createInitialForm());
    setFormError(null);
    setFormOpen(false);
  }

  function updateOption(index: number, patch: Partial<OptionForm>) {
    setForm((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              ...patch,
            }
          : option,
      ),
    }));
  }

  function addOption() {
    setForm((previous) => ({
      ...previous,
      options: [...previous.options, { text: "", score: "0", weightLabel: "Sometimes" }],
    }));
  }

  function removeOption(index: number) {
    setForm((previous) => ({
      ...previous,
      options: previous.options.filter((_, optionIndex) => optionIndex !== index),
    }));
  }

  async function submitQuestion() {
    setSaving(true);
    setFormError(null);

    try {
      const normalizedText = form.text.trim();
      if (normalizedText.length === 0) {
        throw new Error("Question text is required.");
      }

      let normalizedOptions:
        | Array<{
            text: string;
            weightLabel: string;
            score: number;
          }>
        | undefined;

      if (!optionsLocked) {
        normalizedOptions = form.options
          .map((option) => ({
            text: option.text.trim(),
            weightLabel: option.weightLabel.trim(),
            score: Number(option.score),
          }))
          .filter(
            (option) =>
              option.text.length > 0 &&
              option.weightLabel.length > 0 &&
              Number.isFinite(option.score),
          );

        if (normalizedOptions.length < 2) {
          throw new Error("At least two complete options are required.");
        }

        for (const option of normalizedOptions) {
          if (option.score < 0 || option.score > 5) {
            throw new Error("Option scores must be between 0 and 5.");
          }
        }
      }

      const endpoint = editingId
        ? "/api/super-admin/questions/" + editingId
        : "/api/super-admin/questions";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: normalizedText,
          category: form.category,
          difficulty: form.difficulty,
          isActive: form.isActive,
          ...(normalizedOptions ? { options: normalizedOptions } : {}),
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save question.");
      }

      await loadQuestions();
      closeForm();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save question.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleQuestion(question: Question) {
    try {
      const response = await fetch("/api/super-admin/questions/" + question.id + "/toggle", {
        method: "PATCH",
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to toggle question.");
      }

      await loadQuestions();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to toggle question.");
    }
  }

  async function deleteQuestion(question: Question) {
    const confirmed = window.confirm("Delete this question permanently?");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/super-admin/questions/" + question.id, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to delete question.");
      }

      await loadQuestions();
      if (editingId === question.id) {
        closeForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete question.");
    }
  }

  const activeCount = questions.filter((question) => question.isActive).length;
  const inactiveCount = questions.length - activeCount;

  if (loading && questions.length === 0) {
    return <QuestionsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Question Bank</CardTitle>
              <CardDescription>
                Manage competency questions, scoring options, and activation state for assessments.
              </CardDescription>
            </div>

            <Button size="sm" onClick={startCreate}>
              <Plus data-icon="inline-start" />
              New Question
            </Button>
          </div>

          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <TabsList>
              <TabsTrigger value={FILTER_ALL}>All ({questions.length})</TabsTrigger>
              <TabsTrigger value="ACTIVE">Active ({activeCount})</TabsTrigger>
              <TabsTrigger value="INACTIVE">Inactive ({inactiveCount})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search questions or option text"
              />
            </div>

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as typeof categoryFilter)}>
              <SelectTrigger className="w-full" size="default">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={FILTER_ALL}>All Categories</SelectItem>
                  <SelectItem value="HAZARD_RECOGNITION">Hazard Recognition</SelectItem>
                  <SelectItem value="INCIDENT_RESPONSE">Incident Response</SelectItem>
                  <SelectItem value="COMPLIANCE_AWARENESS">Compliance Awareness</SelectItem>
                  <SelectItem value="RISK_ASSESSMENT">Risk Assessment</SelectItem>
                  <SelectItem value="BEHAVIORAL_ACCOUNTABILITY">Behavioral Accountability</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-md border border-border bg-muted/40 px-3 text-xs text-muted-foreground">
              Live filters applied to {filteredQuestions.length} question(s)
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {loading ? <Skeleton className="h-10 w-full" /> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Options</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-16 text-center text-muted-foreground">
                    No questions found with current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell>
                      <p className="max-w-xl truncate text-sm font-medium text-foreground">{question.text}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{toCategoryLabel(question.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{question.difficulty}</Badge>
                    </TableCell>
                    <TableCell>{question.options.length}</TableCell>
                    <TableCell>{question._count?.responses ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={question.isActive ? "success" : "outline"}>
                        {question.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(question.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="xs" variant="outline" onClick={() => startEdit(question)}>
                          Edit
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => void toggleQuestion(question)}>
                          <RotateCcw data-icon="inline-start" />
                          {question.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => void deleteQuestion(question)}>
                          <Trash2 data-icon="inline-start" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {formOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Question" : "Create Question"}</CardTitle>
            <CardDescription>
              Configure question copy, competency, difficulty, and scoring options.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">Question Text</p>
              <Textarea
                value={form.text}
                onChange={(event) => setForm((previous) => ({ ...previous, text: event.target.value }))}
                placeholder="Enter the assessment question"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">Category</p>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((previous) => ({ ...previous, category: value as Category }))}
                >
                  <SelectTrigger className="w-full" size="default">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="HAZARD_RECOGNITION">Hazard Recognition</SelectItem>
                      <SelectItem value="INCIDENT_RESPONSE">Incident Response</SelectItem>
                      <SelectItem value="COMPLIANCE_AWARENESS">Compliance Awareness</SelectItem>
                      <SelectItem value="RISK_ASSESSMENT">Risk Assessment</SelectItem>
                      <SelectItem value="BEHAVIORAL_ACCOUNTABILITY">Behavioral Accountability</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">Difficulty</p>
                <Select
                  value={form.difficulty}
                  onValueChange={(value) => setForm((previous) => ({ ...previous, difficulty: value as Difficulty }))}
                >
                  <SelectTrigger className="w-full" size="default">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <Select
                  value={form.isActive ? "ACTIVE" : "INACTIVE"}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      isActive: value === "ACTIVE",
                    }))
                  }
                >
                  <SelectTrigger className="w-full" size="default">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">Answer Options</p>
                <Button size="xs" variant="outline" onClick={addOption} disabled={optionsLocked}>
                  <Plus data-icon="inline-start" />
                  Add Option
                </Button>
              </div>

              {optionsLocked ? (
                <p className="text-xs text-muted-foreground">
                  Options are locked because this question is already used in submitted assessments.
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                {form.options.map((option, index) => (
                  <div key={"option-" + index} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-12">
                    <div className="sm:col-span-5">
                      <Input
                        value={option.text}
                        disabled={optionsLocked}
                        onChange={(event) => updateOption(index, { text: event.target.value })}
                        placeholder="Option text"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={option.score}
                        disabled={optionsLocked}
                        onChange={(event) => updateOption(index, { score: event.target.value })}
                        placeholder="Score"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <Input
                        value={option.weightLabel}
                        disabled={optionsLocked}
                        onChange={(event) => updateOption(index, { weightLabel: event.target.value })}
                        placeholder="Weight label"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <Button
                        size="icon-xs"
                        variant="outline"
                        disabled={form.options.length <= 2 || optionsLocked}
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={saving} onClick={() => void submitQuestion()}>
                <Save data-icon="inline-start" />
                {saving ? "Saving..." : editingId ? "Update Question" : "Create Question"}
              </Button>
              <Button size="sm" variant="outline" onClick={closeForm} disabled={saving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
