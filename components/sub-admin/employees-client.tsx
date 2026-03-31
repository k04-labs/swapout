"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Eye,
  ClipboardCheck,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";
import { useAppMutation } from "@/hooks/mutation";
import { useAppQuery } from "@/hooks/query";
import { apiClient } from "@/lib/api-client";

type Employee = {
  id: string;
  fullName: string;
  department: string;
  jobRole: string;
  phoneNumber: string;
  site: string;
  isActive: boolean;
  createdAt: string;
  report: {
    latestScore: number | null;
    latestRemark: string | null;
    latestRemarkScore: number | null;
    lastAssessedAt: string | null;
  } | null;
  _count: {
    submissions: number;
  };
};

type EmployeePayload = {
  employees: Employee[];
  message?: string;
};

type EmployeeFormState = {
  fullName: string;
  department: string;
  jobRole: string;
  phoneNumber: string;
  site: string;
};

const initialForm: EmployeeFormState = {
  fullName: "",
  department: "",
  jobRole: "",
  phoneNumber: "",
  site: "",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EmployeesClient() {
  const [formError, setFormError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null,
  );
  const [formState, setFormState] = useState<EmployeeFormState>(initialForm);

  const employeesQuery = useAppQuery<EmployeePayload>({
    queryKey: ["sub-admin-employees"],
    url: "/api/sub-admin/employees",
    fallbackError: "Failed to load employees.",
  });
  const saveEmployeeMutation = useAppMutation<
    { message?: string },
    EmployeeFormState
  >({
    mutationKey: ["sub-admin-save-employee"],
    mutationFn: async (body) => {
      const endpoint = editingEmployeeId
        ? `/api/sub-admin/employees/${editingEmployeeId}`
        : "/api/sub-admin/employees";
      const method = editingEmployeeId ? "patch" : "post";
      const { data } = await apiClient.request<{ message?: string }>({
        url: endpoint,
        method,
        data: body,
      });
      return data;
    },
    invalidateQueryKeys: [["sub-admin-employees"]],
    fallbackError: "Unable to save employee.",
    onSuccess: async () => {
      closeForm();
    },
  });

  const employees = useMemo(
    () => employeesQuery.data?.employees ?? [],
    [employeesQuery.data],
  );
  const loading = employeesQuery.isLoading;
  const isFetching = employeesQuery.isFetching;
  const saving = saveEmployeeMutation.isPending;
  const error = employeesQuery.error?.message ?? null;
  const editingEmployee = useMemo(
    () =>
      employees.find((employee) => employee.id === editingEmployeeId) ?? null,
    [employees, editingEmployeeId],
  );

  function openCreateForm() {
    setEditingEmployeeId(null);
    setFormState(initialForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEditForm(employee: Employee) {
    setEditingEmployeeId(employee.id);
    setFormState({
      fullName: employee.fullName,
      department: employee.department,
      jobRole: employee.jobRole,
      phoneNumber: employee.phoneNumber,
      site: employee.site,
    });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingEmployeeId(null);
    setFormState(initialForm);
    setFormError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    try {
      await saveEmployeeMutation.mutateAsync(formState);
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save employee.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl text-foreground">Employees</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your workforce and trigger assessments.
          </p>
        </div>
        <Button onClick={openCreateForm} size="sm">
          Add Employee
        </Button>
      </div>

      {loading && employees.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`employee-skeleton-${index}`} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && employees.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No employees yet. Add your first employee to begin assessments.
          </p>
        </div>
      ) : null}

      {employees.length > 0 ? (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          {isFetching ? <Skeleton className="h-1 w-full" /> : null}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Department
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Site
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Last Assessed
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Score
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Remark
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {employee.fullName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {employee.phoneNumber}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.department}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.jobRole}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.site}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(employee.report?.lastAssessedAt)}
                  </TableCell>
                  <TableCell>
                    <ScoreBadge score={employee.report?.latestScore ?? null} />
                  </TableCell>
                  <TableCell>
                    <RemarkBadge
                      remarkScore={employee.report?.latestRemarkScore ?? null}
                      remark={employee.report?.latestRemark ?? null}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditForm(employee)}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/sub-admin/employees/${employee.id}`}>
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/sub-admin/employees/${employee.id}/assess`}
                          >
                            <ClipboardCheck className="mr-2 h-3.5 w-3.5" />
                            Start Assessment
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/sub-admin/employees/${employee.id}/report`}
                          >
                            <FileText className="mr-2 h-3.5 w-3.5" />
                            View Report
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (!saving) {
              closeForm();
            }
            return;
          }
          setFormOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle>
            <DialogDescription>
              Capture employee details used for assessments and reporting.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            {formError ? (
              <p className="sm:col-span-2 text-sm text-destructive">{formError}</p>
            ) : null}
            <div className="space-y-1.5">
              <Label
                htmlFor="fullName"
                className="text-xs font-medium text-muted-foreground"
              >
                Full Name
              </Label>
              <Input
                id="fullName"
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    fullName: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="department"
                className="text-xs font-medium text-muted-foreground"
              >
                Department
              </Label>
              <Input
                id="department"
                value={formState.department}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    department: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="jobRole"
                className="text-xs font-medium text-muted-foreground"
              >
                Job Role
              </Label>
              <Input
                id="jobRole"
                value={formState.jobRole}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    jobRole: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="phoneNumber"
                className="text-xs font-medium text-muted-foreground"
              >
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                value={formState.phoneNumber}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    phoneNumber: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="site"
                className="text-xs font-medium text-muted-foreground"
              >
                Site / Location
              </Label>
              <Input
                id="site"
                value={formState.site}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    site: event.target.value,
                  }))
                }
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingEmployee
                    ? "Save Changes"
                    : "Create Employee"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
