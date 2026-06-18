# Task 5: `app/(app)/unemployment/` + `app/(app)/timeline/page.tsx`

> **Do NOT modify:** `lib/opt-engine.ts` (handled in Task 1), `prisma/schema.prisma`

**Files to change:** `app/(app)/unemployment/page.tsx`, `app/(app)/unemployment/unemployment-form.tsx`, `app/(app)/timeline/page.tsx`, `app/api/unemployment/route.ts`

---

- [x] **#9 No edit/delete for unemployment log entries**
  - Add a DELETE endpoint to `app/api/unemployment/route.ts`
  - Add a delete button to each log entry row in `unemployment/page.tsx`

- [x] **#10 No way to update OPT dates after onboarding**
  - Add a settings page at `app/(app)/settings/page.tsx` with a form to update `optStartDate`, `optEndDate`, `employerName`
  - Add a PATCH endpoint at `app/api/settings/route.ts` (new file)

- [x] **#11 Timeline doesn't distinguish milestone states visually**
  - `timeline/page.tsx` uses the same grey dot for all incomplete milestones
  - Use green dot for completed, blue/primary for current/upcoming, grey for future milestones

- [x] **#12 `status.replace("_", " ")` only replaces first underscore**
  - `dashboard/page.tsx` and `timeline/page.tsx` use `.replace("_", " ")` — switch to `.replaceAll("_", " ")` or a label map
  - Note: `analytics/page.tsx` already uses `.replace(/_/g, " ")` correctly — use that pattern everywhere

---

**Tests:**
- DELETE `/api/unemployment/:id` with wrong user → `403`
- DELETE `/api/unemployment/:id` with correct user → `200`, entry removed from DB
- `"stem_active".replaceAll("_", " ")` → `"stem active"`
- Timeline: completed milestone renders green indicator; future milestone renders grey
