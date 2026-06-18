import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { optStartDate, optEndDate, employerName } = await req.json();

  if (optStartDate && optEndDate && new Date(optEndDate) < new Date(optStartDate)) {
    return NextResponse.json({ error: "End date cannot be before start date" }, { status: 400 });
  }

  await prisma.oPTApplication.update({
    where: { userId: session.user.id },
    data: {
      ...(optStartDate && { optStartDate: new Date(optStartDate) }),
      ...(optEndDate && { optEndDate: new Date(optEndDate) }),
      ...(employerName !== undefined && { employerName }),
    },
  });

  return NextResponse.json({ ok: true });
}
