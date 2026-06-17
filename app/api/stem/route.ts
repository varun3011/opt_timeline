import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { optId, applicationDate, stemStartDate, stemEndDate, employerEverify } = await req.json();

  const opt = await prisma.oPTApplication.findUnique({ where: { id: optId } });
  if (opt?.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.stemExtension.upsert({
    where: { optApplicationId: optId },
    create: {
      optApplicationId: optId,
      applicationDate: applicationDate ? new Date(applicationDate) : null,
      stemStartDate: stemStartDate ? new Date(stemStartDate) : null,
      stemEndDate: stemEndDate ? new Date(stemEndDate) : null,
      employerEverify,
      status: "PENDING",
    },
    update: {
      applicationDate: applicationDate ? new Date(applicationDate) : null,
      stemStartDate: stemStartDate ? new Date(stemStartDate) : null,
      stemEndDate: stemEndDate ? new Date(stemEndDate) : null,
      employerEverify,
    },
  });

  return NextResponse.json({ ok: true });
}
