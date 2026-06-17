import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { StemForm } from "./stem-form";

export default async function StemPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const opt = await prisma.oPTApplication.findUnique({
    where: { userId: session.user.id },
    include: { stemExtension: true },
  });
  if (!opt) redirect("/onboarding");

  const stem = opt.stemExtension;

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold">STEM Extension</h1>
        <p className="text-muted-foreground mt-1">24-month STEM OPT extension tracker</p>
      </div>

      {stem ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 grid grid-cols-2 gap-4">
            {[
              { label: "Status", value: stem.status },
              { label: "Application Date", value: stem.applicationDate ? format(stem.applicationDate, "MMM d, yyyy") : "—" },
              { label: "Approval Date", value: stem.approvalDate ? format(stem.approvalDate, "MMM d, yyyy") : "—" },
              { label: "STEM Start", value: stem.stemStartDate ? format(stem.stemStartDate, "MMM d, yyyy") : "—" },
              { label: "STEM End", value: stem.stemEndDate ? format(stem.stemEndDate, "MMM d, yyyy") : "—" },
              { label: "E-Verify Enrolled", value: stem.employerEverify ? "Yes" : "No" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-4">No STEM extension filed yet. File one to extend your work authorization by 24 months.</p>
        </div>
      )}

      <StemForm optId={opt.id} existing={stem} />
    </div>
  );
}
