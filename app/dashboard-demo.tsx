/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * SwapOut — SuperAdmin Dashboard
 * ================================
 * File: app/(super-admin)/dashboard/page.tsx  (or drop anywhere)
 * Deps: shadcn/ui, lucide-react, recharts, tailwindcss
 * Fonts: Add to layout.tsx — Prata (heading) + Geist (body) + Geist Mono (numbers)
 */

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Settings,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// ─── MOCK DATA ───────────────────────────────────────────────

const STATS = [
  {
    label: "Total SubAdmins",
    value: "24",
    sub: "18 approved · 6 pending",
    trend: "up",
    delta: "+3 this month",
  },
  {
    label: "Total Employees",
    value: "186",
    sub: "Across all SubAdmins",
    trend: "up",
    delta: "+12 this week",
  },
  {
    label: "Assessments Done",
    value: "1,284",
    sub: "All time",
    trend: "stable",
    delta: "Stable",
  },
  {
    label: "Platform Avg Score",
    value: "3.6",
    sub: "Out of 5.0",
    trend: "up",
    delta: "↑ from 3.2",
  },
];

const SCORE_TREND = [
  { month: "Oct", score: 2.8 },
  { month: "Nov", score: 3.0 },
  { month: "Dec", score: 3.1 },
  { month: "Jan", score: 3.3 },
  { month: "Feb", score: 3.2 },
  { month: "Mar", score: 3.6 },
];

const ASSESSMENT_BARS = [
  { week: "W1", count: 38 },
  { week: "W2", count: 52 },
  { week: "W3", count: 44 },
  { week: "W4", count: 67 },
  { week: "W5", count: 59 },
  { week: "W6", count: 71 },
];

const LEADERBOARD = [
  {
    rank: 1,
    name: "Arjun Khanna",
    email: "a.khanna@co.com",
    employees: 34,
    assessments: 128,
    score: 4.2,
    trend: "up",
  },
  {
    rank: 2,
    name: "Seema Mehta",
    email: "s.mehta@co.com",
    employees: 28,
    assessments: 97,
    score: 3.8,
    trend: "up",
  },
  {
    rank: 3,
    name: "Ravi Gupta",
    email: "r.gupta@co.com",
    employees: 21,
    assessments: 84,
    score: 3.5,
    trend: "stable",
  },
  {
    rank: 4,
    name: "Priya Nair",
    email: "p.nair@co.com",
    employees: 18,
    assessments: 61,
    score: 3.1,
    trend: "down",
  },
  {
    rank: 5,
    name: "Karan Sharma",
    email: "k.sharma@co.com",
    employees: 14,
    assessments: 43,
    score: 2.9,
    trend: "down",
  },
];

const PENDING_SUBADMINS = [
  { name: "Tanvi Bose", email: "t.bose@corp.com", joined: "Mar 22, 2026" },
  {
    name: "Dev Malhotra",
    email: "d.malhotra@corp.com",
    joined: "Mar 21, 2026",
  },
  { name: "Ritika Joshi", email: "r.joshi@corp.com", joined: "Mar 20, 2026" },
];

const ACTIVITY = [
  {
    name: "Arjun Khanna",
    action: "submitted assessment for",
    target: "Ravi Singh",
    time: "2m ago",
    type: "assessment",
  },
  {
    name: "SuperAdmin",
    action: "approved",
    target: "Seema Mehta",
    time: "18m ago",
    type: "approval",
  },
  {
    name: "Seema Mehta",
    action: "registered employee",
    target: "Priya Nair",
    time: "1h ago",
    type: "register",
  },
  {
    name: "Ravi Gupta",
    action: "submitted assessment for",
    target: "Ankit Roy",
    time: "2h ago",
    type: "assessment",
  },
  {
    name: "Priya Nair",
    action: "registered employee",
    target: "Suresh Babu",
    time: "3h ago",
    type: "register",
  },
];

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, badge: null },
  { icon: UserCheck, label: "Sub Admins", active: false, badge: 6 },
  { icon: Users, label: "All Employees", active: false, badge: null },
  { icon: FileText, label: "Questions", active: false, badge: null },
  {
    icon: Activity,
    label: "Reports",
    active: false,
    badge: null,
    disabled: true,
  },
];

// ─── HELPERS ────────────────────────────────────────────────

function initials(name: string) {
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const AV_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];
function avColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}

function scoreColor(score: number) {
  if (score >= 4) return "text-emerald-600";
  if (score >= 3) return "text-blue-600";
  if (score >= 2) return "text-amber-600";
  return "text-red-500";
}

function remarkLabel(score: number) {
  if (score >= 4.1)
    return {
      label: "Exemplary",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  if (score >= 3.1)
    return {
      label: "Satisfactory",
      cls: "bg-blue-50    text-blue-700    border-blue-200",
    };
  if (score >= 2.1)
    return {
      label: "Developing",
      cls: "bg-yellow-50  text-yellow-700  border-yellow-200",
    };
  if (score >= 1.1)
    return {
      label: "Needs Work",
      cls: "bg-orange-50  text-orange-700  border-orange-200",
    };
  return { label: "Critical", cls: "bg-red-50 text-red-700 border-red-200" };
}

// ─── ATOMS ──────────────────────────────────────────────────

function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const s = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-7 w-7 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  }[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-black/5 ${s} ${avColor(name)}`}
    >
      {initials(name)}
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up")
    return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (trend === "down")
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-slate-400" />;
}

// ─── SIDEBAR ────────────────────────────────────────────────

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-slate-200/80
        bg-white transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:z-auto
      `}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span
              style={{ fontFamily: "'Prata', Georgia, serif" }}
              className="text-sm font-normal tracking-tight text-slate-800"
            >
              SwapOut
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role pill */}
        <div className="px-3 pt-4 pb-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-violet-700 border border-violet-100">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            Super Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.label}
              disabled={item.disabled}
              className={`
                group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium
                transition-all duration-150
                ${
                  item.active
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }
                ${item.disabled ? "pointer-events-none opacity-35" : ""}
              `}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 ${item.active ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"}`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-100 px-1 font-mono text-[10px] font-bold text-violet-700">
                  {item.badge}
                </span>
              ) : null}
              {item.active && (
                <ChevronRight className="h-3 w-3 text-violet-400" />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom user */}
        <div className="border-t border-slate-200/80 p-3">
          <div className="flex items-center gap-2.5 rounded-md p-2 hover:bg-slate-50 cursor-pointer group">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white text-[10px] font-bold shrink-0">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">
                Super Admin
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                admin@swapout.io
              </p>
            </div>
            <LogOut className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── TOPBAR ─────────────────────────────────────────────────

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 w-52">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs text-slate-600 placeholder:text-slate-400 outline-none w-full"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
        </button>
        <button className="rounded-md p-1 hover:bg-slate-100">
          <Avatar name="Super Admin" size="sm" />
        </button>
      </div>
    </header>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────

function StatCard({ stat }: { stat: (typeof STATS)[0] }) {
  return (
    <div className="rounded-md border border-slate-200/80 bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {stat.label}
        </p>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium
          ${stat.trend === "up" ? "text-emerald-600" : stat.trend === "down" ? "text-red-500" : "text-slate-400"}`}
        >
          <TrendIcon trend={stat.trend} />
          {stat.delta}
        </span>
      </div>
      <p
        style={{ fontFamily: "'Prata', Georgia, serif" }}
        className="text-2xl tracking-tight text-slate-900"
      >
        {stat.value}
        {stat.label === "Platform Avg Score" && (
          <span className="font-sans text-sm font-normal text-slate-400">
            /5
          </span>
        )}
      </p>
      <p className="mt-1 text-xs text-slate-400">{stat.sub}</p>
    </div>
  );
}

// ─── CUSTOM CHART TOOLTIP ────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="text-slate-500">{payload[0]?.value}</p>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden"
      style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
    >
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6 space-y-5">
          {/* Page heading */}
          <div className="flex items-center justify-between">
            <div>
              <h1
                style={{ fontFamily: "'Prata', Georgia, serif" }}
                className="text-xl text-slate-900"
              >
                Dashboard
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Tuesday, March 24, 2026
              </p>
            </div>
            <button className="hidden sm:flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-xs">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Export Report
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Score trend — 2/3 width */}
            <div className="lg:col-span-2 rounded-md border border-slate-200/80 bg-white p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Platform Score Trend
                  </p>
                  <p className="text-xs text-slate-400">
                    Avg assessment score over 6 months
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100">
                  <TrendingUp className="h-3 w-3" /> +0.4
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart
                  data={SCORE_TREND}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#7c3aed"
                        stopOpacity={0.15}
                      />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[2, 5]}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fill="url(#scoreGrad)"
                    dot={{ r: 3, fill: "#7c3aed", strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Assessment volume — 1/3 width */}
            <div className="rounded-md border border-slate-200/80 bg-white p-4">
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-800">
                  Weekly Assessments
                </p>
                <p className="text-xs text-slate-400">Submissions per week</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={ASSESSMENT_BARS}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#ede9fe"
                    radius={[3, 3, 0, 0]}
                    activeBar={{ fill: "#7c3aed" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Leaderboard — 2/3 */}
            <div className="lg:col-span-2 rounded-md border border-slate-200/80 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    SubAdmin Leaderboard
                  </p>
                  <p className="text-xs text-slate-400">
                    Ranked by activity & performance
                  </p>
                </div>
                <button className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                  View all
                </button>
              </div>
              <div className="divide-y divide-slate-100/80">
                {LEADERBOARD.map((row) => {
                  const rm = remarkLabel(row.score);
                  return (
                    <div
                      key={row.rank}
                      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors
                      ${row.rank === 1 ? "bg-amber-50/30" : ""}`}
                    >
                      {/* Rank */}
                      <span
                        className={`w-5 shrink-0 text-center font-mono text-xs font-bold
                        ${row.rank === 1 ? "text-amber-500" : row.rank === 2 ? "text-slate-400" : row.rank === 3 ? "text-amber-700/60" : "text-slate-300"}`}
                      >
                        {row.rank}
                      </span>
                      {/* User */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar name={row.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate leading-tight">
                            {row.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate leading-tight">
                            {row.email}
                          </p>
                        </div>
                      </div>
                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-5 text-right shrink-0">
                        <div>
                          <p className="text-[10px] text-slate-400">
                            Employees
                          </p>
                          <p className="font-mono text-xs font-semibold text-slate-700">
                            {row.employees}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">
                            Assessments
                          </p>
                          <p className="font-mono text-xs font-semibold text-slate-700">
                            {row.assessments}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Score</p>
                          <p
                            className={`font-mono text-xs font-bold ${scoreColor(row.score)}`}
                          >
                            {row.score.toFixed(1)}
                          </p>
                        </div>
                        <span
                          className={`hidden lg:inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${rm.cls}`}
                        >
                          {rm.label}
                        </span>
                        <TrendIcon trend={row.trend} />
                      </div>
                      <button className="rounded-md p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Pending approvals */}
              <div className="rounded-md border border-amber-200/80 bg-amber-50/40 overflow-hidden">
                <div className="flex items-center justify-between border-b border-amber-100 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <p className="text-xs font-semibold text-amber-800">
                      Pending Approvals
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                    {PENDING_SUBADMINS.length}
                  </span>
                </div>
                <div className="divide-y divide-amber-100/60">
                  {PENDING_SUBADMINS.map((p) => (
                    <div
                      key={p.email}
                      className="flex items-center gap-2.5 px-3 py-2.5"
                    >
                      <Avatar name={p.name} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate leading-tight">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {p.joined}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                          <CheckCircle2 className="h-3 w-3" />
                        </button>
                        <button className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                          <XCircle className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity feed */}
              <div className="flex-1 rounded-md border border-slate-200/80 bg-white overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-800">
                    Recent Activity
                  </p>
                </div>
                <div className="divide-y divide-slate-100/80 px-3">
                  {ACTIVITY.map((item, i) => (
                    <div key={i} className="flex gap-2.5 py-2.5">
                      <Avatar name={item.name} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          <span className="font-semibold text-slate-800">
                            {item.name}
                          </span>{" "}
                          {item.action}{" "}
                          <span className="font-medium text-slate-700">
                            {item.target}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
