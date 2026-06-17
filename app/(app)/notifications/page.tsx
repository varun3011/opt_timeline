import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { markAllRead } from "./actions";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground mt-1">{notifications.filter((n) => !n.read).length} unread</p>
        </div>
        <form action={markAllRead}>
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">Mark all read</button>
        </form>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 && (
          <p className="text-muted-foreground text-sm">No notifications yet.</p>
        )}
        {notifications.map((n) => (
          <div key={n.id} className={`rounded-xl border border-border p-4 transition-colors ${n.read ? "bg-card opacity-60" : "bg-card"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-muted-foreground text-sm mt-0.5">{n.message}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{format(n.createdAt, "MMM d")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
