import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeTimeline } from "@/lib/opt-engine";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function TimelinePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const opt = await prisma.oPTApplication.findUnique({
    where: { userId: session.user.id },
    include: { stemExtension: true, unemployment: true },
  });
  if (!opt) redirect("/onboarding");

  const tl = computeTimeline(opt);

  const milestones = [
    { label: "OPT Receipt Date", date: opt.receiptDate, done: !!opt.receiptDate },
    { label: "OPT Approval Date", date: opt.approvalDate, done: !!opt.approvalDate },
    { label: "OPT Start Date", date: opt.optStartDate, done: !!opt.optStartDate },
    { label: "EAD Card Received", date: null, done: opt.eadCardReceived },
    { label: "OPT End Date", date: opt.optEndDate, done: false },
    ...(opt.stemExtension
      ? [
          { label: "STEM Application Filed", date: opt.stemExtension.applicationDate, done: !!opt.stemExtension.applicationDate },
          { label: "STEM Approval", date: opt.stemExtension.approvalDate, done: !!opt.stemExtension.approvalDate },
          { label: "STEM Start Date", date: opt.stemExtension.stemStartDate, done: !!opt.stemExtension.stemStartDate },
          { label: "STEM End Date", date: opt.stemExtension.stemEndDate, done: false },
        ]
      : []),
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold">OPT Timeline</h1>
        <p className="text-muted-foreground mt-1">Your immigration milestones at a glance</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold capitalize">{tl.status.replace("_", " ")}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Days Remaining</p>
            <p className="text-3xl font-bold">{tl.daysRemaining}</p>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${tl.progressPercent}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{Math.round(tl.progressPercent)}% elapsed</span>
          <span>{tl.daysRemaining} days left</span>
        </div>
      </div>

      <div className="space-y-1">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg px-4 py-3 hover:bg-accent/50 transition-colors">
            <div className={`h-3 w-3 rounded-full flex-shrink-0 ${m.done ? "bg-green-400" : "bg-muted"}`} />
            <span className="flex-1 text-sm">{m.label}</span>
            <span className="text-sm text-muted-foreground">
              {m.date ? format(new Date(m.date), "MMM d, yyyy") : m.done ? "✓" : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
