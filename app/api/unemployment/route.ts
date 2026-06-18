import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { optId, startDate, endDate, notes } = await req.json();

  if (endDate && new Date(endDate) < new Date(startDate)) {
    return NextResponse.json({ error: "End date cannot be before start date" }, { status: 400 });
  }

  const opt = await prisma.oPTApplication.findUnique({ where: { id: optId } });
  if (opt?.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.unemploymentLog.create({
    data: {
      optApplicationId: optId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const log = await prisma.unemploymentLog.findUnique({
    where: { id },
    include: { optApplication: { select: { userId: true } } },
  });

  if (!log || log.optApplication.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.unemploymentLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
