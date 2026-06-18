# Task 2: `lib/notifications.ts`

> **Do NOT modify:** `app/api/cron/notifications/route.ts` — cron secret check is already correctly implemented there (#8 resolved ✅)

**Files to change:** `lib/notifications.ts`

---

- [x] **#2 Email only fires at wrong threshold**
  - Email currently sends only if `daysRemaining <= 60`, but unemployment alerts should also trigger emails regardless of days remaining
  - Decouple: send email for every alert, not just when `daysRemaining <= 60`

- [x] **#3 No pagination on `findMany` for all users**
  - `prisma.user.findMany` loads every user at once — will be slow/OOM at scale
  - Process in batches using cursor-based pagination (e.g. chunks of 100)

---

**Tests:**
- User with 85 unemployment days on OPT → unemployment alert email sent even if `daysRemaining > 60`
- User with 0 alerts → no email sent, no notification created
- Duplicate alert within 24h → not re-created (existing dedup logic stays)
