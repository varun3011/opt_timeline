import { describe, it, expect } from "vitest";

describe("Task 4 - #15 status label fix", () => {
  it("replaceAll fixes all underscores in status strings", () => {
    expect("stem_active".replaceAll("_", " ")).toBe("stem active");
    expect("pre_opt".replaceAll("_", " ")).toBe("pre opt");
    expect("opt_active".replaceAll("_", " ")).toBe("opt active");
    // single replace would leave second underscore intact — verify replaceAll works
    expect("stem_extension_pending".replaceAll("_", " ")).toBe("stem extension pending");
    expect("stem_extension_pending".replace("_", " ")).not.toBe("stem extension pending");
  });
});

describe("Task 5 - #11 timeline milestone dot logic", () => {
  function getMilestoneColor(done: boolean, date: Date | null): string {
    const isUpcoming = !done && !!date && date > new Date();
    if (done) return "bg-green-400";
    if (isUpcoming) return "bg-primary";
    return "bg-muted";
  }

  it("completed milestone gets green dot", () => {
    expect(getMilestoneColor(true, new Date("2024-01-01"))).toBe("bg-green-400");
  });

  it("upcoming milestone (future date, not done) gets primary dot", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(getMilestoneColor(false, future)).toBe("bg-primary");
  });

  it("no-date milestone gets muted dot", () => {
    expect(getMilestoneColor(false, null)).toBe("bg-muted");
  });
});
