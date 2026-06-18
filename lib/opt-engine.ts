import { differenceInDays, addDays, isPast, isWithinInterval } from "date-fns";
import type { OPTApplication, StemExtension, UnemploymentLog } from "@prisma/client";

export type TimelineStatus =
  | "pre_opt"
  | "opt_active"
  | "stem_pending"
  | "stem_active"
  | "expired"
  | "critical"
  | "warning";

export interface TimelineData {
  status: TimelineStatus;
  daysRemaining: number;
  totalDays: number;
  progressPercent: number;
  unemploymentDaysUsed: number;
  unemploymentDaysRemaining: number;
  nextDeadline: { label: string; date: Date } | null;
  alerts: string[];
}

const OPT_UNEMPLOYMENT_LIMIT = 90;
const STEM_UNEMPLOYMENT_LIMIT = 150;

export function calcUnemploymentDays(logs: UnemploymentLog[]): number {
  return logs.reduce((sum, log) => {
    const end = log.endDate ?? new Date();
    return sum + differenceInDays(end, log.startDate) + 1;
  }, 0);
}

export function computeTimeline(
  opt: OPTApplication & { stemExtension: StemExtension | null; unemployment: UnemploymentLog[] }
): TimelineData {
  const alerts: string[] = [];
  const unemploymentDaysUsed = calcUnemploymentDays(opt.unemployment);
  const isStem = !!opt.stemExtension?.stemStartDate;
  const unemploymentLimit = isStem ? STEM_UNEMPLOYMENT_LIMIT : OPT_UNEMPLOYMENT_LIMIT;
  const unemploymentDaysRemaining = unemploymentLimit - unemploymentDaysUsed;

  if (unemploymentDaysRemaining <= 10) {
    alerts.push(`Only ${unemploymentDaysRemaining} unemployment days remaining!`);
  }

  if (!opt.optStartDate || !opt.optEndDate) {
    return {
      status: "pre_opt",
      daysRemaining: 0,
      totalDays: 0,
      progressPercent: 0,
      unemploymentDaysUsed,
      unemploymentDaysRemaining,
      nextDeadline: null,
      alerts,
    };
  }

  const now = new Date();
  const stemEnd = opt.stemExtension?.stemEndDate;
  const endDate = stemEnd ?? opt.optEndDate;
  const startDate = opt.stemExtension?.stemStartDate ?? opt.optStartDate;
  const totalDays = differenceInDays(endDate, startDate);
  const daysRemaining = differenceInDays(endDate, now);
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100)
  );

  let status: TimelineStatus = "opt_active";
  if (isPast(endDate)) status = "expired";
  else if (daysRemaining <= 30) status = "critical";
  else if (daysRemaining <= 60) status = "warning";
  else if (stemEnd && isWithinInterval(now, { start: startDate, end: stemEnd }))
    status = "stem_active";

  // STEM application reminder: apply 90 days before OPT ends
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
  };
}
