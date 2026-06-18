import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { computeTimeline } from "@/lib/opt-engine";
import { TrackerClient } from "./tracker-client";

export default async function TrackerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const opt = await prisma.oPTApplication.findUnique({
    where: { userId: session.user.id },
    include: {
      stemExtension: true,
      unemployment: true,
      employmentHistory: { orderBy: { startDate: "asc" } },
    },
  });
  if (!opt) redirect("/onboarding");

  const timeline = computeTimeline(opt);

  return (
    <TrackerClient
      opt={{
        id: opt.id,
        optStartDate: opt.optStartDate?.toISOString() ?? null,
        optEndDate: opt.optEndDate?.toISOString() ?? null,
        stemStartDate: opt.stemExtension?.stemStartDate?.toISOString() ?? null,
        stemEndDate: opt.stemExtension?.stemEndDate?.toISOString() ?? null,
      }}
      timeline={timeline}
      initialJobs={opt.employmentHistory.map((j) => ({
        id: j.id,
        employerName: j.employerName,
        startDate: j.startDate.toISOString(),
        endDate: j.endDate?.toISOString() ?? null,
        isCurrent: j.isCurrent,
      }))}
    />
  );
}
