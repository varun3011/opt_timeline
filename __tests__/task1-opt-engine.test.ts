import { describe, it, expect } from "vitest";
import { calcUnemploymentDays, computeTimeline } from "@/lib/opt-engine";
import type { UnemploymentLog, OPTApplication, StemExtension } from "@prisma/client";

function makeLog(startDate: Date, endDate?: Date): UnemploymentLog {
  return {
    id: "1",
    optApplicationId: "opt1",
    startDate,
    endDate: endDate ?? null,
    notes: null,
    createdAt: new Date(),
  };
}

describe("calcUnemploymentDays", () => {
  it("returns 0 for empty logs", () => {
    expect(calcUnemploymentDays([])).toBe(0);
  });

  it("counts same-day entry as 1 day", () => {
    const day = new Date("2025-01-15");
    expect(calcUnemploymentDays([makeLog(day, day)])).toBe(1);
  });

  it("counts open-ended log from start to today", () => {
    const start = new Date();
    start.setDate(start.getDate() - 4);
    const days = calcUnemploymentDays([makeLog(start)]);
    expect(days).toBe(5); // 4 days diff + 1
  });

  it("sums multiple logs correctly", () => {
    const logs = [
      makeLog(new Date("2025-01-01"), new Date("2025-01-05")), // 5 days
      makeLog(new Date("2025-02-01"), new Date("2025-02-03")), // 3 days
    ];
    expect(calcUnemploymentDays(logs)).toBe(8);
  });
});

describe("computeTimeline unemployment limits", () => {
  function makeOpt(unemploymentDays: number, isStem = false): OPTApplication & {
    stemExtension: StemExtension | null;
    unemployment: UnemploymentLog[];
  } {
    const start = new Date("2024-01-01");
    const end = new Date("2025-01-01");
    const logs = unemploymentDays > 0
      ? [makeLog(new Date("2024-06-01"), new Date(new Date("2024-06-01").getTime() + (unemploymentDays - 1) * 86400000))]
      : [];

    return {
      id: "opt1",
      userId: "user1",
      status: "ACTIVE",
      receiptDate: null,
      approvalDate: null,
      optStartDate: start,
      optEndDate: end,
      eadCardReceived: false,
      employerName: null,
      employerEin: null,
      jobTitle: null,
      jobStartDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      stemExtension: isStem
        ? {
            id: "stem1",
            optApplicationId: "opt1",
            status: "ACTIVE",
            applicationDate: null,
            approvalDate: null,
            stemStartDate: new Date("2025-01-01"),
            stemEndDate: new Date("2027-01-01"),
            employerEverify: false,
            i983SubmittedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
      unemployment: logs,
    };
  }

  it("unemploymentDaysRemaining is 0 when OPT limit (90) exceeded", () => {
    const tl = computeTimeline(makeOpt(95));
    expect(tl.unemploymentDaysRemaining).toBe(0);
  });

  it("uses 150 day limit for STEM", () => {
    const tl = computeTimeline(makeOpt(95, true));
    expect(tl.unemploymentDaysRemaining).toBe(55);
  });
});
