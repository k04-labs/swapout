"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RemarkBadge } from "@/components/sub-admin/remark-badge";
import { ScoreBadge } from "@/components/sub-admin/score-badge";
import { cn } from "@/lib/utils";

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
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [formState, setFormState] = useState<EmployeeFormState>(initialForm);

  async function loadEmployees() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sub-admin/employees", { cache: "no-store" });
      const payload = (await response.json()) as EmployeePayload;

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load employees.");
      }

      setEmployees(payload.employees);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
  }, []);

  const editingEmployee = useMemo(
    () => employees.find((employee) => employee.id === editingEmployeeId) ?? null,
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
      setError(submitError instanceof Error ? submitError.message : "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Employees</CardTitle>
          <Button onClick={openCreateForm}>Add Employee</Button>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-slate-500">Loading employees...</p> : null}
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

          {!loading && employees.length === 0 ? (
            <p className="text-sm text-slate-500">No employees yet. Add your first employee to begin assessments.</p>
          ) : null}

          {employees.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Department</th>
                    <th className="px-3 py-2">Job Role</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">Site</th>
                    <th className="px-3 py-2">Enrolled</th>
                    <th className="px-3 py-2">Last Assessed</th>
                    <th className="px-3 py-2">Latest Score</th>
                    <th className="px-3 py-2">Remark</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-t border-slate-200 align-top">
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">{employee.fullName}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{employee.department}</td>
                      <td className="px-3 py-3 text-slate-700">{employee.jobRole}</td>
                      <td className="px-3 py-3 text-slate-700">{employee.phoneNumber}</td>
                      <td className="px-3 py-3 text-slate-700">{employee.site}</td>
                      <td className="px-3 py-3 text-slate-700">{formatDate(employee.createdAt)}</td>
                      <td className="px-3 py-3 text-slate-700">{formatDate(employee.report?.lastAssessedAt)}</td>
                      <td className="px-3 py-3">
                        <ScoreBadge score={employee.report?.latestScore ?? null} />
                      </td>
                      <td className="px-3 py-3">
                        <RemarkBadge
                          remarkScore={employee.report?.latestRemarkScore ?? null}
                          remark={employee.report?.latestRemark ?? null}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditForm(employee)}>
                            Edit
                          </Button>
                          <Link
                            href={`/sub-admin/employees/${employee.id}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            View
                          </Link>
                          <Link
                            href={`/sub-admin/employees/${employee.id}/assess`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            Submit Assessment
                          </Link>
                          <Link
                            href={`/sub-admin/employees/${employee.id}/report`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            View Report
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {formOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formState.fullName}
                  onChange={(event) => setFormState((prev) => ({ ...prev, fullName: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formState.department}
                  onChange={(event) => setFormState((prev) => ({ ...prev, department: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobRole">Job Role</Label>
                <Input
                  id="jobRole"
                  value={formState.jobRole}
                  onChange={(event) => setFormState((prev) => ({ ...prev, jobRole: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formState.phoneNumber}
                  onChange={(event) => setFormState((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="site">Site / Location</Label>
                <Input
                  id="site"
                  value={formState.site}
                  onChange={(event) => setFormState((prev) => ({ ...prev, site: event.target.value }))}
                  required
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingEmployee ? "Save Changes" : "Create Employee"}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
