import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { computeTimeline } from "@/lib/opt-engine";

let resend: Resend;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendDeadlineNotifications() {
  const users = await prisma.user.findMany({
    include: {
      optApplication: { include: { stemExtension: true, unemployment: true } },
    },
  });

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

      if (tl.daysRemaining <= 60) {
        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: user.email,
          subject: "OPT Timeline Alert",
          html: `<p>Hi ${user.name ?? ""},</p><p>${alert}</p><p>Log in to <a href="${process.env.NEXT_PUBLIC_APP_URL}">OPT Timeline</a> for details.</p>`,
        });
      }
    }
  }
}
