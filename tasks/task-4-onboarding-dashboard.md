# Task 4: `app/onboarding/page.tsx` + `app/(app)/dashboard/page.tsx`

> **Do NOT modify:** `app/api/onboarding/route.ts`, `app/(app)/layout.tsx`

**Files to change:** `app/onboarding/page.tsx`, `app/(app)/dashboard/page.tsx`

---

- [x] **#6 Misleading OPT end date auto-fill**
  - Auto-calculating OPT end = start + 12 months is an estimate; real date comes from the EAD card
  - Add a visible note near the end date field: "This is an estimate. Use the exact date from your EAD card."

- [x] **#14 Silent failure on onboarding form submit**
  - The `fetch` call in `onboarding/page.tsx` has no error handling
  - Add try/catch and show an error message to the user on failure, re-enable the submit button

- [x] **#15 Two separate DB queries in dashboard**
  - Dashboard calls `prisma.oPTApplication.findUnique` then `prisma.notification.findMany` as two separate queries
  - Fetch notifications via the user relation or a combined include to reduce to one round-trip

---

**Tests:**
- Onboarding: API returns `500` → error message shown, submit button re-enabled
- Onboarding: EAD note text is present in rendered output
- Dashboard: only one DB call made (spy on `prisma.oPTApplication.findUnique`)
