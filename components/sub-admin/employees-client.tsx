"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">Loading employees...</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && employees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            No employees yet. Add your first employee to begin assessments.
          </p>
        </div>
      ) : null}

      {employees.length > 0 ? (
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Site
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Last Assessed
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Remark
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {employee.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {employee.phoneNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {employee.department}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {employee.jobRole}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {employee.site}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDate(employee.report?.lastAssessedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge
                        score={employee.report?.latestScore ?? null}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <RemarkBadge
                        remarkScore={employee.report?.latestRemarkScore ?? null}
                        remark={employee.report?.latestRemark ?? null}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          onClick={() => openEditForm(employee)}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/sub-admin/employees/${employee.id}`}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/sub-admin/employees/${employee.id}/assess`}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          Assess
                        </Link>
                        <Link
                          href={`/sub-admin/employees/${employee.id}/report`}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          Report
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {formOpen ? (
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
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
                  className="h-9 border-slate-200 bg-slate-50/50"
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
                  className="h-9 border-slate-200 bg-slate-50/50"
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
                  className="h-9 border-slate-200 bg-slate-50/50"
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
                  className="h-9 border-slate-200 bg-slate-50/50"
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
                  className="h-9 border-slate-200 bg-slate-50/50"
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
