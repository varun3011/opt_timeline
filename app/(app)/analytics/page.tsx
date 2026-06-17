import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { computeTimeline } from "@/lib/opt-engine";
import { differenceInDays } from "date-fns";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const opt = await prisma.oPTApplication.findUnique({
    where: { userId: session.user.id },
    include: { stemExtension: true, unemployment: { orderBy: { startDate: "asc" } } },
  });
  if (!opt) redirect("/onboarding");

  const tl = computeTimeline(opt);
  const totalUnemployment = opt.unemployment.reduce(
    (s: number, l: { startDate: Date; endDate: Date | null }) => s + differenceInDays(l.endDate ?? new Date(), l.startDate), 0
  );

  const stats = [
    { label: "Total OPT Period", value: `${tl.totalDays} days` },
    { label: "Days Elapsed", value: `${tl.totalDays - tl.daysRemaining} days` },
    { label: "Days Remaining", value: `${tl.daysRemaining} days` },
    { label: "Progress", value: `${Math.round(tl.progressPercent)}%` },
    { label: "Unemployment Used", value: `${totalUnemployment} days` },
    { label: "Unemployment Remaining", value: `${tl.unemploymentDaysRemaining} days` },
    { label: "STEM Extension", value: opt.stemExtension ? "Applied" : "Not filed" },
    { label: "Current Status", value: tl.status.replace(/_/g, " ") },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Detailed breakdown of your OPT usage</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold capitalize">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-medium mb-4">Unemployment History</h3>
        {opt.unemployment.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unemployment periods logged.</p>
        ) : (
          <div className="space-y-2">
            {opt.unemployment.map((log) => {
              const days = differenceInDays(log.endDate ?? new Date(), log.startDate);
              return (
                <div key={log.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {log.startDate.toLocaleDateString()} → {log.endDate?.toLocaleDateString() ?? "Ongoing"}
                  </span>
                  <span className="font-medium">{days} days</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
