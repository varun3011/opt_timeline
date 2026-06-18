# Task 1: `lib/opt-engine.ts`

> **Do NOT modify:** `prisma/schema.prisma`, `lib/prisma.ts`

**Files to change:** `lib/opt-engine.ts`, `app/(app)/unemployment/page.tsx`, `app/(app)/analytics/page.tsx`

---

- [x] **#1 Off-by-one in `calcUnemploymentDays`**
  - `differenceInDays(end, start)` returns 0 for same-day entries — add `+1` to count inclusively
  - Fix in `lib/opt-engine.ts` → `calcUnemploymentDays`

- [x] **#13 Duplicated unemployment calculation**
  - `unemployment/page.tsx` and `analytics/page.tsx` both re-implement the same `reduce` loop
  - Export `calcUnemploymentDays` from `opt-engine.ts` and import it in both pages instead

---

**Tests:**
- `calcUnemploymentDays([])` → `0`
- Same-day log (start === end) → `1`
- Open-ended log (no endDate) → days from start to today
- Multiple logs → correct sum
- `computeTimeline` with 90+ days unemployment on OPT (not STEM) → `unemploymentDaysRemaining` is 0 or negative
