import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { computeTimeline } from "@/lib/opt-engine";

let resend: Resend;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const BATCH_SIZE = 100;

export async function sendDeadlineNotifications() {
  let cursor: string | undefined;

  while (true) {
    const users = await prisma.user.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        optApplication: { include: { stemExtension: true, unemployment: true } },
      },
    });

    if (users.length === 0) break;

    for (const user of users) {
      if (!user.email || !user.optApplication) continue;
      const tl = computeTimeline(user.optApplication);

      for (const alert of tl.alerts) {
        const existing = await prisma.notification.findFirst({
          where: { userId: user.id, message: alert, createdAt: { gte: new Date(Date.now() - 86400000) } },
        });
        if (existing) continue;

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "DEADLINE_REMINDER",
            title: "OPT Deadline Alert",
            message: alert,
          },
        });

        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: user.email,
          subject: "OPT Timeline Alert",
          html: `<p>Hi ${user.name ?? ""},</p><p>${alert}</p><p>Log in to <a href="${process.env.NEXT_PUBLIC_APP_URL}">OPT Timeline</a> for details.</p>`,
        });
      }
    }

    cursor = users[users.length - 1].id;
    if (users.length < BATCH_SIZE) break;
  }
}
