import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { calcUnemploymentDays } from "@/lib/opt-engine";
import { UnemploymentForm } from "./unemployment-form";
import { DeleteUnemploymentButton } from "./unemployment-form";

export default async function UnemploymentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const opt = await prisma.oPTApplication.findUnique({
    where: { userId: session.user.id },
    include: { unemployment: { orderBy: { startDate: "desc" } }, stemExtension: true },
  });
  if (!opt) redirect("/onboarding");

  const totalDays = calcUnemploymentDays(opt.unemployment);
  const limit = opt.stemExtension ? 150 : 90;

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold">Unemployment Tracker</h1>
        <p className="text-muted-foreground mt-1">Track your unemployment days to stay compliant</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex justify-between mb-3">
          <span className="text-sm font-medium">Days Used</span>
          <span className={`text-sm font-medium ${totalDays >= limit * 0.8 ? "text-red-400" : "text-green-400"}`}>
            {totalDays} / {limit}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${totalDays >= limit * 0.8 ? "bg-red-500" : "bg-green-500"}`}
            style={{ width: `${Math.min(100, (totalDays / limit) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{limit - totalDays} days remaining</p>
      </div>

      <UnemploymentForm optId={opt.id} />

      <div className="space-y-2">
        {opt.unemployment.map((log) => (
          <div key={log.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
            <span>{format(log.startDate, "MMM d")} → {log.endDate ? format(log.endDate, "MMM d, yyyy") : "Ongoing"}</span>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                {differenceInDays(log.endDate ?? new Date(), log.startDate) + 1} days
              </span>
            <DeleteUnemploymentButton id={log.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
