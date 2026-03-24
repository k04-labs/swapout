"use client";

/**
 * SwapOut — Dashboard Branding System
 * =====================================
 * Drop this file into your project and import from it.
 * All tokens come from globals.css (oklch purple-hue palette).
 *
 * Usage:
 *   import { StatCard, RemarkBadge, TrendIndicator, ... } from "@/components/branding"
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// 1. BADGE — status, remark level, approval state
// ─────────────────────────────────────────────────────────────

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium leading-none transition-colors select-none",
  {
    variants: {
      variant: {
        // Remark levels
        critical:
          "border-red-200    bg-red-50    text-red-700    dark:border-red-800   dark:bg-red-950   dark:text-red-300",
        needs:
          "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
        developing:
          "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
        satisfactory:
          "border-blue-200  bg-blue-50   text-blue-700   dark:border-blue-800  dark:bg-blue-950  dark:text-blue-300",
        exemplary:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        // Approval states
        approved:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        pending:
          "border-amber-200  bg-amber-50  text-amber-700  dark:border-amber-800  dark:bg-amber-950  dark:text-amber-300",
        rejected:
          "border-red-200    bg-red-50    text-red-700    dark:border-red-800   dark:bg-red-950   dark:text-red-300",
        // Generic
        default: "border-border bg-muted text-muted-foreground",
        primary: "border-primary/20 bg-primary/10 text-primary",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. REMARK BADGE — maps remark score 1–5 to badge variant
// ─────────────────────────────────────────────────────────────

const REMARK_MAP: Record<
  number,
  { label: string; variant: BadgeProps["variant"]; dot: string }
> = {
  1: { label: "Critical Risk", variant: "critical", dot: "bg-red-500" },
  2: { label: "Needs Improvement", variant: "needs", dot: "bg-orange-500" },
  3: { label: "Developing", variant: "developing", dot: "bg-yellow-500" },
  4: { label: "Satisfactory", variant: "satisfactory", dot: "bg-blue-500" },
  5: { label: "Exemplary", variant: "exemplary", dot: "bg-emerald-500" },
};

export function RemarkBadge({
  score,
  showDot = true,
  className,
}: {
  score: 1 | 2 | 3 | 4 | 5;
  showDot?: boolean;
  className?: string;
}) {
  const map = REMARK_MAP[score];
  return (
    <Badge variant={map.variant} className={cn("gap-1.5", className)}>
      {showDot && (
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", map.dot)}
        />
      )}
      {map.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. APPROVAL BADGE
// ─────────────────────────────────────────────────────────────

export function ApprovalBadge({
  status,
  className,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED";
  className?: string;
}) {
  const map: Record<string, BadgeProps["variant"]> = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  };
  const labels: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return (
    <Badge variant={map[status]} className={className}>
      {labels[status]}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. TREND INDICATOR
// ─────────────────────────────────────────────────────────────

export function TrendIndicator({
  trend,
  value,
  className,
}: {
  trend: "improving" | "declining" | "stable" | null;
  value?: string;
  className?: string;
}) {
  if (!trend || trend === "stable") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground",
          className,
        )}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {value ?? "Stable"}
      </span>
    );
  }
  if (trend === "improving") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400",
          className,
        )}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 9l3.5-4L8 7l3-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {value ?? "Improving"}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400",
        className,
      )}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2 3l3.5 4L8 5l3 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {value ?? "Declining"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. SCORE BADGE — "3.8 / 5"
// ─────────────────────────────────────────────────────────────

export function ScoreBadge({
  score,
  max = 5,
  className,
}: {
  score: number;
  max?: number;
  className?: string;
}) {
  const pct = score / max;
  const color =
    pct >= 0.8
      ? "text-emerald-600 dark:text-emerald-400"
      : pct >= 0.6
        ? "text-blue-600 dark:text-blue-400"
        : pct >= 0.4
          ? "text-yellow-600 dark:text-yellow-400"
          : pct >= 0.2
            ? "text-orange-600 dark:text-orange-400"
            : "text-red-600 dark:text-red-400";

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-0.5 font-mono text-sm font-medium tabular-nums",
        color,
        className,
      )}
    >
      {score.toFixed(1)}
      <span className="text-xs font-normal text-muted-foreground">/{max}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. STAT CARD — dashboard metric card
// ─────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  trendValue,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: "improving" | "declining" | "stable" | null;
  trendValue?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8 text-primary">
            {icon}
          </span>
        )}
      </div>
      <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {(sub || trend) && (
        <div className="mt-1.5 flex items-center gap-2">
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          {trend && <TrendIndicator trend={trend} value={trendValue} />}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. AVATAR — initials circle with color derived from name
// ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300",
  "bg-rose-100   text-rose-700   dark:bg-rose-900/40   dark:text-rose-300",
  "bg-cyan-100   text-cyan-700   dark:bg-cyan-900/40   dark:text-cyan-300",
];

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % AVATAR_COLORS.length;
}

const avatarSizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-xs",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-12 w-12 text-sm",
};

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof avatarSizes;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-1 ring-border",
          avatarSizes[size],
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium ring-1 ring-border",
        avatarSizes[size],
        AVATAR_COLORS[getColorIndex(name)],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. USER ROW — avatar + name + sub-label inline
// ─────────────────────────────────────────────────────────────

export function UserRow({
  name,
  sub,
  src,
  avatarSize = "sm",
  className,
}: {
  name: string;
  sub?: string;
  src?: string | null;
  avatarSize?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Avatar name={name} src={src} size={avatarSize} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground leading-tight">
          {name}
        </p>
        {sub && (
          <p className="truncate text-xs text-muted-foreground leading-tight">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. SCORE RING — circular progress showing score out of 5
// ─────────────────────────────────────────────────────────────

export function ScoreRing({
  score,
  max = 5,
  size = 56,
  strokeWidth = 5,
  className,
}: {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / max, 1);
  const offset = circumference * (1 - pct);

  const color =
    pct >= 0.8
      ? "#10b981"
      : pct >= 0.6
        ? "#3b82f6"
        : pct >= 0.4
          ? "#eab308"
          : pct >= 0.2
            ? "#f97316"
            : "#ef4444";

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span
        className="absolute font-mono text-xs font-semibold tabular-nums"
        style={{ color }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. PROGRESS BAR — thin horizontal bar
// ─────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max = 5,
  label,
  showValue = true,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 60
        ? "bg-blue-500"
        : pct >= 40
          ? "bg-yellow-500"
          : pct >= 20
            ? "bg-orange-500"
            : "bg-red-500";

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between">
          {label && <p className="text-xs text-muted-foreground">{label}</p>}
          {showValue && (
            <p className="font-mono text-xs font-medium tabular-nums text-foreground">
              {value.toFixed(1)}
              <span className="text-muted-foreground">/{max}</span>
            </p>
          )}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. COMPETENCY BREAKDOWN — list of 5 categories with bars
// ─────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  HAZARD_RECOGNITION: "Hazard Recognition",
  INCIDENT_RESPONSE: "Incident Response",
  COMPLIANCE_AWARENESS: "Compliance Awareness",
  RISK_ASSESSMENT: "Risk Assessment",
  BEHAVIORAL_ACCOUNTABILITY: "Behavioral Accountability",
};

export function CompetencyBreakdown({
  scores,
  className,
}: {
  scores: Record<string, number>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Object.entries(scores).map(([key, val]) => (
        <ProgressBar
          key={key}
          label={CATEGORY_LABELS[key] ?? key}
          value={val}
          max={5}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 12. EMPTY STATE
// ─────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="max-w-xs text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 13. LEADERBOARD ROW — ranked subAdmin
// ─────────────────────────────────────────────────────────────

export function LeaderboardRow({
  rank,
  name,
  email,
  src,
  assessments,
  employees,
  avgScore,
  consistency,
  className,
}: {
  rank: number;
  name: string;
  email?: string;
  src?: string | null;
  assessments: number;
  employees: number;
  avgScore: number;
  consistency: number;
  className?: string;
}) {
  const rankStyle =
    rank === 1
      ? "text-amber-500 font-bold"
      : rank === 2
        ? "text-slate-400 font-semibold"
        : rank === 3
          ? "text-amber-700/70 font-semibold"
          : "text-muted-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50",
        rank === 1 && "bg-amber-50/50 dark:bg-amber-950/20",
        className,
      )}
    >
      <span
        className={cn(
          "w-5 shrink-0 text-center font-mono text-sm tabular-nums",
          rankStyle,
        )}
      >
        {rank}
      </span>
      <UserRow
        name={name}
        sub={email}
        avatarSize="sm"
        className="flex-1 min-w-0"
      />
      <div className="hidden sm:flex items-center gap-4 text-right">
        <div className="w-14">
          <p className="text-xs text-muted-foreground">Employees</p>
          <p className="font-mono text-sm font-medium tabular-nums">
            {employees}
          </p>
        </div>
        <div className="w-14">
          <p className="text-xs text-muted-foreground">Assessments</p>
          <p className="font-mono text-sm font-medium tabular-nums">
            {assessments}
          </p>
        </div>
        <div className="w-14">
          <p className="text-xs text-muted-foreground">Avg Score</p>
          <ScoreBadge score={avgScore} />
        </div>
        <div className="w-16">
          <p className="text-xs text-muted-foreground">Consistency</p>
          <div className="mt-0.5">
            <ProgressBar value={consistency} max={100} showValue={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 14. PENDING APPROVAL BANNER
// ─────────────────────────────────────────────────────────────

export function PendingApprovalBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40",
        className,
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 5v3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11" r="0.75" fill="currentColor" />
      </svg>
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Account pending approval
        </p>
        <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
          Your account is awaiting approval from the administrator. Actions are
          disabled until approved.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 15. SECTION HEADER — page/section title with optional action
// ─────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 16. DATA TABLE WRAPPER — consistent table shell
// ─────────────────────────────────────────────────────────────

export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/40">{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-3 py-2.5 text-sm text-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function DataTableRow({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-border/60 last:border-0 transition-colors",
        onClick && "cursor-pointer hover:bg-accent/50",
        className,
      )}
    >
      {children}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// 17. SIDEBAR NAV ITEM
// ─────────────────────────────────────────────────────────────

export function NavItem({
  icon,
  label,
  active,
  disabled,
  badge,
  onClick,
  className,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "h-4 w-4 shrink-0",
            active
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground",
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 font-mono text-[10px] font-semibold text-primary">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 18. CARD — generic elevated card
// ─────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  padding = "default",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "default" | "lg";
}) {
  const padMap = {
    none: "",
    sm: "p-3",
    default: "p-4",
    lg: "p-6",
  };
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-xs",
        padMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mb-4 flex items-start justify-between gap-3", className)}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 19. ACTIVITY ITEM — recent activity feed row
// ─────────────────────────────────────────────────────────────

export function ActivityItem({
  name,
  action,
  target,
  time,
  avatarSrc,
  className,
}: {
  name: string;
  action: string;
  target: string;
  time: string;
  avatarSrc?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 py-2.5", className)}>
      <Avatar
        name={name}
        src={avatarSrc}
        size="sm"
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-tight">
          <span className="font-medium text-foreground">{name}</span>{" "}
          <span className="text-muted-foreground">{action}</span>{" "}
          <span className="font-medium text-foreground">{target}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 20. PAGE SHELL — main layout wrapper for content area
// ─────────────────────────────────────────────────────────────

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6", className)}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 21. GRID — responsive stat grid
// ─────────────────────────────────────────────────────────────

export function StatGrid({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colMap = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };
  return (
    <div className={cn("grid gap-3", colMap[cols], className)}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// EXPORTS SUMMARY (re-exported for clean barrel import)
// ─────────────────────────────────────────────────────────────
// Badge, RemarkBadge, ApprovalBadge
// TrendIndicator, ScoreBadge, ScoreRing, ProgressBar
// CompetencyBreakdown
// StatCard, StatGrid
// Avatar, UserRow
// LeaderboardRow
// PendingApprovalBanner
// SectionHeader
// DataTable, DataTableHead, DataTableRow, Th, Td
// NavItem
// Card, CardHeader
// ActivityItem
// PageShell
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// DEFAULT PAGE EXPORT — Branding system showcase
// ─────────────────────────────────────────────────────────────

export default function page() {
  return (
    <PageShell>
      <SectionHeader
        title="SwapOut Branding System"
        description="Complete component library and design system showcase"
      />

      <div className="space-y-8">
        {/* Badges Section */}
        <Card>
          <CardHeader
            title="Badges & Status Indicators"
            description="Generic badges, remark levels, and approval states"
          />
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Generic Badges
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Remark Badges (1-5)
              </p>
              <div className="flex flex-wrap gap-2">
                <RemarkBadge score={5} />
                <RemarkBadge score={4} />
                <RemarkBadge score={3} />
                <RemarkBadge score={2} />
                <RemarkBadge score={1} />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Approval Badges
              </p>
              <div className="flex flex-wrap gap-2">
                <ApprovalBadge status="APPROVED" />
                <ApprovalBadge status="PENDING" />
                <ApprovalBadge status="REJECTED" />
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Approval Banner */}
        <PendingApprovalBanner />

        {/* Stats Section */}
        <div>
          <h2 className="mb-3 text-sm font-medium">
            Stat Cards with Trend Indicators
          </h2>
          <StatGrid cols={4}>
            <StatCard
              label="Total Employees"
              value="1,234"
              trend="improving"
              trendValue="+12%"
            />
            <StatCard label="Assessments" value="567" trend="stable" />
            <StatCard
              label="Avg Score"
              value="4.2"
              sub="/ 5"
              trend="improving"
              trendValue="+0.3"
            />
            <StatCard
              label="Completion Rate"
              value="89%"
              trend="declining"
              trendValue="-5%"
            />
          </StatGrid>
        </div>

        {/* Score Components */}
        <Card>
          <CardHeader
            title="Score Visualization Components"
            description="Rings, badges, and progress bars for displaying scores"
          />
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-6">
              <ScoreRing score={4.2} />
              <ScoreRing score={3.5} size={48} strokeWidth={4} />
              <ScoreRing score={2.8} size={40} strokeWidth={3} />
            </div>
            <div className="flex flex-wrap gap-3">
              <ScoreBadge score={4.8} />
              <ScoreBadge score={3.6} />
              <ScoreBadge score={2.2} />
            </div>
            <div className="space-y-2">
              <ProgressBar value={4.5} label="Excellent Progress" />
              <ProgressBar value={3.2} label="Good Progress" />
              <ProgressBar value={1.8} label="Needs Improvement" />
            </div>
          </div>
        </Card>

        {/* Competency Breakdown */}
        <Card>
          <CardHeader
            title="Competency Breakdown"
            description="Five-category assessment visualization"
          />
          <CompetencyBreakdown
            scores={{
              HAZARD_RECOGNITION: 4.2,
              INCIDENT_RESPONSE: 3.8,
              COMPLIANCE_AWARENESS: 4.5,
              RISK_ASSESSMENT: 3.5,
              BEHAVIORAL_ACCOUNTABILITY: 4.0,
            }}
          />
        </Card>

        {/* User Components */}
        <Card>
          <CardHeader
            title="User Components"
            description="Avatars and user rows with different sizes"
          />
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Avatar Sizes
              </p>
              <div className="flex items-center gap-3">
                <Avatar name="John Doe" size="xs" />
                <Avatar name="Jane Smith" size="sm" />
                <Avatar name="Bob Wilson" size="md" />
                <Avatar name="Alice Brown" size="lg" />
                <Avatar name="Charlie Davis" size="xl" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                User Rows
              </p>
              <div className="space-y-2">
                <UserRow
                  name="John Doe"
                  sub="john@example.com"
                  avatarSize="sm"
                />
                <UserRow
                  name="Jane Smith"
                  sub="jane@example.com"
                  avatarSize="md"
                />
                <UserRow
                  name="Bob Wilson"
                  sub="bob@example.com"
                  avatarSize="lg"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader
            title="Leaderboard Rankings"
            description="Ranked sub-admin performance display"
          />
          <div className="space-y-1">
            <LeaderboardRow
              rank={1}
              name="Sarah Johnson"
              email="sarah@example.com"
              assessments={145}
              employees={89}
              avgScore={4.7}
              consistency={95}
            />
            <LeaderboardRow
              rank={2}
              name="Michael Chen"
              email="michael@example.com"
              assessments={132}
              employees={76}
              avgScore={4.5}
              consistency={92}
            />
            <LeaderboardRow
              rank={3}
              name="Emily Rodriguez"
              email="emily@example.com"
              assessments={128}
              employees={71}
              avgScore={4.4}
              consistency={89}
            />
            <LeaderboardRow
              rank={4}
              name="David Kim"
              email="david@example.com"
              assessments={115}
              employees={65}
              avgScore={4.2}
              consistency={87}
            />
          </div>
        </Card>

        {/* Data Table */}
        <Card padding="none">
          <div className="p-4 pb-0">
            <CardHeader
              title="Data Table Components"
              description="Structured tabular data display"
              className="mb-4"
            />
          </div>
          <DataTable>
            <DataTableHead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th align="center">Status</Th>
                <Th align="right">Score</Th>
              </tr>
            </DataTableHead>
            <tbody>
              <DataTableRow onClick={() => alert("Row clicked!")}>
                <Td>
                  <UserRow
                    name="John Doe"
                    sub="Software Engineer"
                    avatarSize="xs"
                  />
                </Td>
                <Td>Senior Engineer</Td>
                <Td align="center">
                  <RemarkBadge score={5} showDot={false} />
                </Td>
                <Td align="right">
                  <ScoreBadge score={4.8} />
                </Td>
              </DataTableRow>
              <DataTableRow onClick={() => alert("Row clicked!")}>
                <Td>
                  <UserRow
                    name="Jane Smith"
                    sub="Product Manager"
                    avatarSize="xs"
                  />
                </Td>
                <Td>Lead PM</Td>
                <Td align="center">
                  <RemarkBadge score={4} showDot={false} />
                </Td>
                <Td align="right">
                  <ScoreBadge score={4.2} />
                </Td>
              </DataTableRow>
              <DataTableRow onClick={() => alert("Row clicked!")}>
                <Td>
                  <UserRow name="Bob Wilson" sub="Designer" avatarSize="xs" />
                </Td>
                <Td>UI/UX Designer</Td>
                <Td align="center">
                  <RemarkBadge score={3} showDot={false} />
                </Td>
                <Td align="right">
                  <ScoreBadge score={3.5} />
                </Td>
              </DataTableRow>
            </tbody>
          </DataTable>
        </Card>

        {/* Navigation Items */}
        <Card>
          <CardHeader
            title="Navigation Items"
            description="Sidebar navigation components with states"
          />
          <div className="space-y-1">
            <NavItem
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              }
              label="Dashboard"
              active
            />
            <NavItem
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
              label="Employees"
              badge={23}
            />
            <NavItem
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              }
              label="Reports"
            />
            <NavItem
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              }
              label="Pending Approval"
              badge={5}
            />
            <NavItem
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                </svg>
              }
              label="Archived"
              disabled
            />
          </div>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader
            title="Activity Feed"
            description="Recent activity items with avatars"
          />
          <div className="divide-y divide-border">
            <ActivityItem
              name="Sarah Johnson"
              action="completed assessment for"
              target="John Doe"
              time="2 minutes ago"
            />
            <ActivityItem
              name="Michael Chen"
              action="added new employee"
              target="Alice Brown"
              time="15 minutes ago"
            />
            <ActivityItem
              name="Emily Rodriguez"
              action="updated report for"
              target="Team Alpha"
              time="1 hour ago"
            />
            <ActivityItem
              name="David Kim"
              action="approved assessment of"
              target="Charlie Davis"
              time="3 hours ago"
            />
          </div>
        </Card>

        {/* Empty State */}
        <Card>
          <CardHeader
            title="Empty State Component"
            description="Placeholder for empty data scenarios"
          />
          <EmptyState
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 2v4M15 2v4M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              </svg>
            }
            title="No assessments yet"
            description="Get started by creating your first assessment"
            action={
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Create Assessment
              </button>
            }
          />
        </Card>
      </div>
    </PageShell>
  );
}
