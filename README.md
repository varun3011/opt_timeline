# OPT Timeline — F-1 Immigration Manager

A web app for F-1 international students to track OPT and STEM OPT deadlines, unemployment days, and stay on top of their immigration status.

🚀 **Live Demo**: [opt-timeline-app.vercel.app](https://opt-timeline-app.vercel.app)

---

## Features

- **Dashboard** — Real-time OPT status, days remaining, and smart alerts
- **Timeline** — Visual timeline of your OPT and STEM extension dates
- **Unemployment Tracker** — Log periods and get warned before hitting the 90/150-day limit
- **STEM Extension** — Track your STEM OPT application and dates
- **Analytics** — Detailed breakdown of days used, remaining, and progress
- **AI Assistant** — Ask immigration questions powered by OpenAI
- **Email Notifications** — Daily reminders for upcoming deadlines via Resend
- **Google OAuth** — Sign in with your Google account

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Radix UI |
| Database | PostgreSQL (Neon) |
| ORM | Prisma v7 |
| Auth | NextAuth v5 (Google OAuth) |
| AI | OpenAI API |
| Email | Resend |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/opt-timeline.git
cd opt-timeline
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your `.env` file — see [Environment Variables](#environment-variables) below.

### 4. Set up the database

```bash
npx prisma migrate dev
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. from [Neon](https://neon.tech)) |
| `AUTH_SECRET` | Random secret — generate with `openssl rand -hex 32` |
| `AUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | API key from [Resend](https://resend.com) |
| `RESEND_FROM_EMAIL` | Sender email address |
| `OPENAI_API_KEY` | API key from [OpenAI](https://platform.openai.com) |
| `NEXT_PUBLIC_APP_URL` | Your public app URL |
| `CRON_SECRET` | Secret to protect cron endpoint — generate with `openssl rand -hex 32` |

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy the client ID and secret to your `.env`

---

## Deployment

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Add all environment variables in **Vercel Dashboard → Settings → Environment Variables**.

Add your production URL to Google OAuth authorized redirect URIs:
```
https://your-app.vercel.app/api/auth/callback/google
```

---

## Project Structure

```
app/
├── (app)/              # Protected app routes
│   ├── dashboard/      # Main dashboard
│   ├── timeline/       # Visual timeline
│   ├── unemployment/   # Unemployment log
│   ├── stem/           # STEM extension
│   ├── analytics/      # Analytics page
│   ├── ai-assistant/   # AI chat
│   └── notifications/  # Notification settings
├── api/
│   ├── auth/           # NextAuth handlers
│   ├── ai-chat/        # OpenAI endpoint
│   ├── cron/           # Daily notification job
│   ├── onboarding/     # Save OPT dates
│   ├── stem/           # STEM extension API
│   └── unemployment/   # Unemployment log API
├── sign-in/            # Sign in page
└── onboarding/         # First-time setup

lib/
├── opt-engine.ts       # Core timeline calculation logic
├── prisma.ts           # Prisma client
└── notifications.ts    # Email notification logic

prisma/
└── schema.prisma       # Database schema
```

---

## License

MIT
