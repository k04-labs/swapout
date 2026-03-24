"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
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
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null,
  );
  const [formState, setFormState] = useState<EmployeeFormState>(initialForm);

  async function loadEmployees() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sub-admin/employees", {
        cache: "no-store",
      });
      const payload = (await response.json()) as EmployeePayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load employees.");
      }

      setEmployees(payload.employees);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load employees.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
  }, []);

  const editingEmployee = useMemo(
    () =>
      employees.find((employee) => employee.id === editingEmployeeId) ?? null,
    [employees, editingEmployeeId],
  );

  function openCreateForm() {
    setEditingEmployeeId(null);
    setFormState(initialForm);
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
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingEmployeeId(null);
    setFormState(initialForm);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const endpoint = editingEmployeeId
        ? `/api/sub-admin/employees/${editingEmployeeId}`
        : "/api/sub-admin/employees";
      const method = editingEmployeeId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save employee.");
      }

      await loadEmployees();
      closeForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save employee.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl text-slate-900">Employees</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Manage your workforce and trigger assessments.
          </p>
        </div>
        <Button onClick={openCreateForm} size="sm">
          Add Employee
        </Button>
      </div>

      {loading ? (
        <div className="rounded-md border border-slate-200/80 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">Loading employees...</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && employees.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            No employees yet. Add your first employee to begin assessments.
          </p>
        </div>
      ) : null}

      {employees.length > 0 ? (
        <div className="rounded-md border border-slate-200/80 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Name
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Department
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Role
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Site
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Last Assessed
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Score
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Remark
                </TableHead>
                <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <p className="font-medium text-slate-800">
                      {employee.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {employee.phoneNumber}
                    </p>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {employee.department}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {employee.jobRole}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {employee.site}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
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
                        <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
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

      {formOpen ? (
        <div className="rounded-md border border-slate-200/80 bg-white overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-medium text-slate-800">
              {editingEmployee ? "Edit Employee" : "Add Employee"}
            </p>
          </div>
          <div className="p-5">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label
                  htmlFor="fullName"
                  className="text-xs font-medium text-slate-600"
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
                  className="border-slate-200 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="department"
                  className="text-xs font-medium text-slate-600"
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
                  required
                  className="border-slate-200 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="jobRole"
                  className="text-xs font-medium text-slate-600"
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
                  required
                  className="border-slate-200 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="phoneNumber"
                  className="text-xs font-medium text-slate-600"
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
                  required
                  className="border-slate-200 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="site"
                  className="text-xs font-medium text-slate-600"
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
                  required
                  className="border-slate-200 bg-slate-50/50"
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
