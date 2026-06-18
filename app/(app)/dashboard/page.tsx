import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeTimeline, calcUnemploymentDays } from "@/lib/opt-engine";
import { redirect } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const opt = await prisma.oPTApplication.findUnique({
    where: { userId: session.user.id },
    include: {
      stemExtension: true,
      unemployment: true,
      employmentHistory: { orderBy: { startDate: "asc" } },
      user: {
        select: {
          notifications: {
            where: { read: false },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  if (!opt) redirect("/onboarding");

  const timeline = computeTimeline(opt);
  const notifications = opt.user.notifications;

  const statusColors: Record<string, string> = {
    pre_opt: "text-muted-foreground",
    opt_active: "text-green-400",
    stem_active: "text-blue-400",
    warning: "text-yellow-400",
    critical: "text-red-400",
    expired: "text-red-500",
  };

  const analyticsStats = [
    { label: "Total OPT Period", value: `${timeline.totalDays} days` },
    { label: "Days Elapsed", value: `${timeline.totalDays - timeline.daysRemaining} days` },
    { label: "Days Remaining", value: `${timeline.daysRemaining} days` },
    { label: "Progress", value: `${Math.round(timeline.progressPercent)}%` },
    { label: "Unemployment Used", value: `${timeline.unemploymentDaysUsed} days` },
    { label: "Unemployment Remaining", value: `${timeline.unemploymentDaysRemaining} days` },
    { label: "STEM Extension", value: opt.stemExtension ? "Applied" : "Not filed" },
    { label: "Status", value: timeline.status.replaceAll("_", " ") },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {session.user.name?.split(" ")[0]}</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="OPT Status" value={opt.status.replaceAll("_", " ")} color={statusColors[timeline.status]} />
        <StatCard label="Days Remaining" value={String(timeline.daysRemaining)} sublabel="until expiry" />
        <StatCard label="Unemployment Days" value={`${timeline.unemploymentDaysUsed} / ${timeline.unemploymentDaysUsed + timeline.unemploymentDaysRemaining}`} sublabel="days used" />
        <StatCard label="Progress" value={`${Math.round(timeline.progressPercent)}%`} sublabel="of OPT period" />
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex justify-between mb-3">
          <span className="text-sm font-medium">OPT Period Progress</span>
          <span className="text-sm text-muted-foreground">
            {opt.optStartDate && format(opt.optStartDate, "MMM d, yyyy")} →{" "}
            {opt.optEndDate && format(opt.optEndDate, "MMM d, yyyy")}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${timeline.progressPercent}%` }} />
        </div>
      </div>

      {/* Alerts */}
      {timeline.alerts.length > 0 && (
        <div className="space-y-2">
          {timeline.alerts.map((alert, i) => (
            <div key={i} className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
              ⚠ {alert}
            </div>
          ))}
        </div>
      )}

      {/* Next Deadline */}
      {timeline.nextDeadline && (
        <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Next Deadline</p>
            <p className="text-lg font-semibold mt-1">{timeline.nextDeadline.label}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{differenceInDays(timeline.nextDeadline.date, new Date())} days</p>
            <p className="text-sm text-muted-foreground">{format(timeline.nextDeadline.date, "MMMM d, yyyy")}</p>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: "/tracker", label: "Unemployment Tracker" },
          { href: "/stem", label: "STEM & Timeline" },
          { href: "/assistant", label: "AI Assistant" },
          { href: "/settings", label: "Settings" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="rounded-lg border border-border bg-card px-4 py-3 text-center text-sm font-medium hover:bg-accent transition-colors">
            {label}
          </Link>
        ))}
      </div>

      {/* Analytics Stats */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-medium mb-4">Analytics</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {analyticsStats.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-0.5 font-semibold capitalize text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unread notifications */}
      {notifications.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-medium mb-4">Recent Notifications</h3>
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted-foreground">{n.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sublabel, color }: { label: string; value: string; sublabel?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color ?? ""}`}>{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
    </div>
  );
}
