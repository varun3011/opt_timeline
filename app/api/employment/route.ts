import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getOpt(userId: string) {
  return prisma.oPTApplication.findUnique({ where: { userId } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const opt = await getOpt(session.user.id);
  if (!opt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const history = await prisma.employmentHistory.findMany({
    where: { optApplicationId: opt.id },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(history);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const opt = await getOpt(session.user.id);
  if (!opt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { employerName, startDate, endDate, isCurrent } = await req.json();
  if (!employerName || !startDate) return NextResponse.json({ error: "employerName and startDate required" }, { status: 400 });
  if (!isCurrent && endDate && new Date(endDate) < new Date(startDate)) {
    return NextResponse.json({ error: "End date cannot be before start date" }, { status: 400 });
  }

  const entry = await prisma.employmentHistory.create({
    data: {
      optApplicationId: opt.id,
      employerName,
      startDate: new Date(startDate),
      endDate: isCurrent ? null : (endDate ? new Date(endDate) : null),
      isCurrent: !!isCurrent,
    },
  });
  return NextResponse.json(entry);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, employerName, startDate, endDate, isCurrent } = await req.json();
  const entry = await prisma.employmentHistory.findUnique({
    where: { id },
    include: { optApplication: { select: { userId: true } } },
  });
  if (!entry || entry.optApplication.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.employmentHistory.update({
    where: { id },
    data: {
      ...(employerName !== undefined && { employerName }),
      ...(startDate && { startDate: new Date(startDate) }),
      endDate: isCurrent ? null : (endDate ? new Date(endDate) : null),
      isCurrent: !!isCurrent,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const entry = await prisma.employmentHistory.findUnique({
    where: { id },
    include: { optApplication: { select: { userId: true } } },
  });
  if (!entry || entry.optApplication.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.employmentHistory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
