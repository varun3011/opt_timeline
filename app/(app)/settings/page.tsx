import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const opt = await prisma.oPTApplication.findUnique({
    where: { userId: session.user.id },
    select: { optStartDate: true, optEndDate: true, employerName: true },
  });
  if (!opt) redirect("/onboarding");

  return (
    <div className="space-y-8 animate-fade-in max-w-md">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">Update your OPT dates and employer info</p>
      </div>
      <SettingsForm
        optStartDate={opt.optStartDate?.toISOString().split("T")[0] ?? ""}
        optEndDate={opt.optEndDate?.toISOString().split("T")[0] ?? ""}
        employerName={opt.employerName ?? ""}
      />
    </div>
  );
}
