"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ActivitySquare, TrendingUp, Bot, Settings, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tracker", label: "Unemployment Tracker", icon: ActivitySquare },
  { href: "/stem", label: "STEM & Timeline", icon: TrendingUp },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-card px-3 py-4">
      <div className="mb-8 px-3">
        <h1 className="text-lg font-semibold tracking-tight">OPT Timeline</h1>
        <p className="text-xs text-muted-foreground">F-1 Immigration Manager</p>
      </div>
      <nav className="flex-1 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              path === href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1">
        <Link href="/settings" className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          path === "/settings" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}>
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
