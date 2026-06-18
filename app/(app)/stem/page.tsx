import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { computeTimeline } from "@/lib/opt-engine";
import { StemForm } from "./stem-form";

export default async function StemPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const opt = await prisma.oPTApplication.findUnique({
    where: { userId: session.user.id },
    include: { stemExtension: true, unemployment: true, employmentHistory: true },
  });
  if (!opt) redirect("/onboarding");

  const tl = computeTimeline(opt);
  const stem = opt.stemExtension;

  const milestones = [
    { label: "OPT Receipt Date", date: opt.receiptDate, done: !!opt.receiptDate },
    { label: "OPT Approval Date", date: opt.approvalDate, done: !!opt.approvalDate },
    { label: "OPT Start Date", date: opt.optStartDate, done: !!opt.optStartDate },
    { label: "EAD Card Received", date: null, done: opt.eadCardReceived },
    { label: "OPT End Date", date: opt.optEndDate, done: false },
    ...(stem ? [
      { label: "STEM Application Filed", date: stem.applicationDate, done: !!stem.applicationDate },
      { label: "STEM Approval", date: stem.approvalDate, done: !!stem.approvalDate },
      { label: "STEM Start Date", date: stem.stemStartDate, done: !!stem.stemStartDate },
      { label: "STEM End Date", date: stem.stemEndDate, done: false },
    ] : []),
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold">STEM Extension</h1>
        <p className="text-muted-foreground mt-1">24-month STEM OPT extension tracker &amp; timeline</p>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold capitalize">{tl.status.replaceAll("_", " ")}</p>
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

      {/* Timeline milestones */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-medium mb-4">OPT Timeline</h3>
        <div className="space-y-1">
          {milestones.map((m, i) => {
            const isUpcoming = !m.done && !!m.date && new Date(m.date) > new Date();
            const dotColor = m.done ? "bg-green-400" : isUpcoming ? "bg-primary" : "bg-muted";
            return (
              <div key={i} className="flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors">
                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                <span className="flex-1 text-sm">{m.label}</span>
                <span className="text-sm text-muted-foreground">
                  {m.date ? format(new Date(m.date), "MMM d, yyyy") : m.done ? "✓" : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEM details */}
      {stem && (
        <div className="rounded-xl border border-border bg-card p-6 grid grid-cols-2 gap-4">
          {[
            { label: "Status", value: stem.status },
            { label: "Application Date", value: stem.applicationDate ? format(stem.applicationDate, "MMM d, yyyy") : "—" },
            { label: "Approval Date", value: stem.approvalDate ? format(stem.approvalDate, "MMM d, yyyy") : "—" },
            { label: "E-Verify Enrolled", value: stem.employerEverify ? "Yes" : "No" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium mt-0.5 capitalize">{value}</p>
            </div>
          ))}
        </div>
      )}

      <StemForm optId={opt.id} existing={stem} />
    </div>
  );
}
