import { differenceInDays, max, min } from "date-fns";
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
  const now = new Date();
  const effectiveEnd = min([windowEnd, now]);
  if (effectiveEnd <= windowStart) return 0;

  // Build covered intervals from jobs within window
  const sorted = [...jobs]
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  let employed = 0;
  let cursor = windowStart;

  for (const job of sorted) {
    const jobStart = max([job.startDate, windowStart]);
    const jobEnd = min([job.endDate ?? now, effectiveEnd]);
    if (jobStart >= effectiveEnd) break;
    if (jobEnd <= cursor) continue;
    const start = max([jobStart, cursor]);
    if (start < jobEnd) {
      employed += differenceInDays(jobEnd, start);
      cursor = jobEnd;
    }
  }

  const totalWindow = differenceInDays(effectiveEnd, windowStart);
  return Math.max(0, totalWindow - employed);
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
      : calcUnemploymentDays(
          opt.unemployment.filter(
            (l) => l.startDate >= opt.optStartDate! && (l.endDate ?? new Date()) <= opt.optEndDate!
          )
        );
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
    // STEM limit is 150 CUMULATIVE across both phases
    const phase2Used = jobs.length > 0
      ? calcUnemploymentFromJobs(jobs, opt.stemExtension.stemStartDate, opt.stemExtension.stemEndDate)
      : calcUnemploymentDays(
          opt.unemployment.filter(
            (l) =>
              l.startDate >= opt.stemExtension!.stemStartDate! &&
              (l.endDate ?? new Date()) <= opt.stemExtension!.stemEndDate!
          )
        );
    const phase1Used = phases[0]?.used ?? 0;
    const totalUsed = phase1Used + phase2Used;
    phases.push({
      phase: 2,
      label: "Phase 2: STEM OPT Extension",
      start: opt.stemExtension.stemStartDate,
      end: opt.stemExtension.stemEndDate,
      limit: STEM_UNEMPLOYMENT_LIMIT,
      used: phase2Used,
      remaining: Math.max(0, STEM_UNEMPLOYMENT_LIMIT - totalUsed),
      percentUsed: Math.min(100, Math.round((totalUsed / STEM_UNEMPLOYMENT_LIMIT) * 100)),
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
  const stemStart = opt.stemExtension?.stemStartDate;
  const optNotStarted = now < opt.optStartDate;
  const optExpired = now > opt.optEndDate;
  const inStem = !!stemStart && !!stemEnd && now >= stemStart && now <= stemEnd;
  const stemExpired = !!stemEnd && now > stemEnd;

  // Progress tracks only the current active phase
  const phaseStart = inStem && stemStart ? stemStart : opt.optStartDate;
  const phaseEnd = inStem && stemEnd ? stemEnd : opt.optEndDate;
  const totalDays = differenceInDays(phaseEnd, phaseStart);
  const elapsed = Math.max(0, differenceInDays(now, phaseStart));
  const daysRemaining = Math.max(0, differenceInDays(phaseEnd, now));
  const progressPercent = totalDays > 0
    ? Math.min(100, Math.max(0, (elapsed / totalDays) * 100))
    : 0;

  let status: TimelineStatus;
  if (stemExpired) status = "expired";
  else if (optExpired && !inStem) status = stemEnd ? "stem_pending" : "expired";
  else if (optNotStarted) status = "pre_opt";
  else if (inStem) status = "stem_active";
  else if (daysRemaining <= 30) status = "critical";
  else if (daysRemaining <= 60) status = "warning";
  else status = "opt_active";

  if (!opt.stemExtension && !optExpired && !optNotStarted && differenceInDays(opt.optEndDate, now) <= 90) {
    alerts.push("Time to apply for STEM OPT extension!");
  }

  // Next deadline: most relevant upcoming date
  let nextDeadline: { label: string; date: Date } | null = null;
  if (optNotStarted) {
    nextDeadline = { label: "OPT Starts", date: opt.optStartDate };
  } else if (!optExpired) {
    nextDeadline = { label: "OPT Expires", date: opt.optEndDate };
  } else if (stemEnd && !stemExpired) {
    nextDeadline = { label: "STEM OPT Expires", date: stemEnd };
  }

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
