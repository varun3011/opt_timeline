import { Sidebar } from "@/components/sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Bell } from "lucide-react";
import Link from "next/link";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user!.id!, read: false },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center justify-end border-b border-border bg-card px-6 shrink-0">
          <Link href="/notifications" className="relative text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-8">{children}</main>
      </div>
    </div>
  );
}
