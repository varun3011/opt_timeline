import { differenceInDays, isPast, isWithinInterval, max, min } from "date-fns";
import type { OPTApplication, StemExtension, UnemploymentLog, EmploymentHistory } from "@prisma/client";

export type TimelineStatus =
  | "pre_opt"
  | "opt_active"
  | "stem_pending"
  | "stem_active"
  | "expired"
  | "critical"
  | "warning";

export interface PhaseBreakdown {
  phase: 1 | 2;
  label: string;
  start: Date;
  end: Date;
  limit: number;
  used: number;
  remaining: number;
  percentUsed: number;
}

export interface TimelineData {
  status: TimelineStatus;
  daysRemaining: number;
  totalDays: number;
  progressPercent: number;
  unemploymentDaysUsed: number;
  unemploymentDaysRemaining: number;
  nextDeadline: { label: string; date: Date } | null;
  alerts: string[];
  phases: PhaseBreakdown[];
}

const OPT_UNEMPLOYMENT_LIMIT = 90;
const STEM_UNEMPLOYMENT_LIMIT = 150;

export function calcUnemploymentDays(logs: UnemploymentLog[]): number {
  return logs.reduce((sum, log) => {
    const end = log.endDate ?? new Date();
    return sum + differenceInDays(end, log.startDate) + 1;
  }, 0);
}

/** Calculate unemployment days within a specific date window from employment gaps */
export function calcUnemploymentFromJobs(
  jobs: EmploymentHistory[],
  windowStart: Date,
  windowEnd: Date
): number {
  if (!jobs.length) return 0;
  const now = new Date();
  const sorted = [...jobs].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  let unemployed = 0;
  let cursor = windowStart;

  for (const job of sorted) {
    const jobStart = max([job.startDate, windowStart]);
    const jobEnd = min([job.endDate ?? now, windowEnd]);

    if (jobStart > cursor) {
      // gap before this job
      unemployed += Math.max(0, differenceInDays(jobStart, cursor));
    }
    if (jobEnd > cursor) cursor = jobEnd;
    if (cursor >= windowEnd) break;
  }

  // gap after last job
  if (cursor < windowEnd) {
    unemployed += Math.max(0, differenceInDays(min([windowEnd, now]), cursor));
  }

  return unemployed;
}

export function computeTimeline(
  opt: OPTApplication & {
    stemExtension: StemExtension | null;
    unemployment: UnemploymentLog[];
    employmentHistory?: EmploymentHistory[];
  }
): TimelineData {
  const alerts: string[] = [];
  const jobs = opt.employmentHistory ?? [];
  const now = new Date();

  // Use employment gaps if history exists, else fall back to manual logs
  const unemploymentDaysUsed = jobs.length > 0 && opt.optStartDate && opt.optEndDate
    ? calcUnemploymentFromJobs(jobs, opt.optStartDate, opt.stemExtension?.stemEndDate ?? opt.optEndDate)
    : calcUnemploymentDays(opt.unemployment);

  const isStem = !!opt.stemExtension?.stemStartDate;
  const unemploymentLimit = isStem ? STEM_UNEMPLOYMENT_LIMIT : OPT_UNEMPLOYMENT_LIMIT;
  const unemploymentDaysRemaining = unemploymentLimit - unemploymentDaysUsed;

  if (unemploymentDaysRemaining <= 10) {
    alerts.push(`Only ${Math.max(0, unemploymentDaysRemaining)} unemployment days remaining!`);
  }

  // Build phase breakdown
  const phases: PhaseBreakdown[] = [];

  if (opt.optStartDate && opt.optEndDate) {
    const phase1Used = jobs.length > 0
      ? calcUnemploymentFromJobs(jobs, opt.optStartDate, opt.optEndDate)
      : calcUnemploymentDays(opt.unemployment);
    phases.push({
      phase: 1,
      label: "Phase 1: Post-Completion OPT",
      start: opt.optStartDate,
      end: opt.optEndDate,
      limit: OPT_UNEMPLOYMENT_LIMIT,
      used: phase1Used,
      remaining: Math.max(0, OPT_UNEMPLOYMENT_LIMIT - phase1Used),
      percentUsed: Math.min(100, Math.round((phase1Used / OPT_UNEMPLOYMENT_LIMIT) * 100)),
    });
  }

  if (opt.stemExtension?.stemStartDate && opt.stemExtension?.stemEndDate) {
    const phase2Used = jobs.length > 0
      ? calcUnemploymentFromJobs(jobs, opt.stemExtension.stemStartDate, opt.stemExtension.stemEndDate)
      : 0;
    phases.push({
      phase: 2,
      label: "Phase 2: STEM OPT Extension",
      start: opt.stemExtension.stemStartDate,
      end: opt.stemExtension.stemEndDate,
      limit: STEM_UNEMPLOYMENT_LIMIT,
      used: phase2Used,
      remaining: Math.max(0, STEM_UNEMPLOYMENT_LIMIT - phase2Used),
      percentUsed: Math.min(100, Math.round((phase2Used / STEM_UNEMPLOYMENT_LIMIT) * 100)),
    });
  }

  if (!opt.optStartDate || !opt.optEndDate) {
    return {
      status: "pre_opt",
      daysRemaining: 0,
      totalDays: 0,
      progressPercent: 0,
      unemploymentDaysUsed,
      unemploymentDaysRemaining: Math.max(0, unemploymentDaysRemaining),
      nextDeadline: null,
      alerts,
      phases,
    };
  }

  const stemEnd = opt.stemExtension?.stemEndDate;
  const endDate = stemEnd ?? opt.optEndDate;
  const startDate = opt.stemExtension?.stemStartDate ?? opt.optStartDate;
  const totalDays = differenceInDays(endDate, startDate);
  const daysRemaining = differenceInDays(endDate, now);
  const progressPercent = Math.min(100, Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100));

  let status: TimelineStatus = "opt_active";
  if (isPast(endDate)) status = "expired";
  else if (daysRemaining <= 30) status = "critical";
  else if (daysRemaining <= 60) status = "warning";
  else if (stemEnd && isWithinInterval(now, { start: startDate, end: stemEnd })) status = "stem_active";

  if (!opt.stemExtension && daysRemaining <= 90) {
    alerts.push("Time to apply for STEM OPT extension!");
  }

  const nextDeadline = daysRemaining > 0
    ? { label: stemEnd ? "STEM OPT Expires" : "OPT Expires", date: endDate }
    : null;

  return {
    status,
    daysRemaining: Math.max(0, daysRemaining),
    totalDays,
    progressPercent,
    unemploymentDaysUsed,
    unemploymentDaysRemaining: Math.max(0, unemploymentDaysRemaining),
    nextDeadline,
    alerts,
    phases,
  };
}
