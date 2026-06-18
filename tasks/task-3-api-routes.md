# Task 3: `app/api/` Route Handlers

> **Do NOT modify:** `app/api/onboarding/route.ts`, `app/api/stem/route.ts`, `app/api/cron/notifications/route.ts`

**Files to change:** `app/api/ai-chat/route.ts`, `app/api/unemployment/route.ts`

---

- [x] **#4 New `OpenAI` instance per request**
  - Move `new OpenAI(...)` outside the handler to module scope in `app/api/ai-chat/route.ts`

- [x] **#5 No validation on unemployment date range**
  - In `app/api/unemployment/route.ts` — if `endDate` is provided, reject if `endDate < startDate`
  - Return `400` with a descriptive error message

- [x] **#7 No limit on `messages` array in AI chat**
  - In `app/api/ai-chat/route.ts` — cap `messages` to last 20 items before sending to OpenAI to prevent token stuffing

- [ ] **#8 ~~Cron secret not validated~~** ✅ Already done
  - `app/api/cron/notifications/route.ts` already checks `Authorization: Bearer <CRON_SECRET>` — no change needed

---

**Tests:**
- POST `/api/unemployment` with `endDate < startDate` → `400`
- POST `/api/unemployment` with valid dates → `200`
- POST `/api/ai-chat` with 50 messages → only last 20 sent to OpenAI (mock OpenAI client)
- POST `/api/ai-chat` without session → `401`
