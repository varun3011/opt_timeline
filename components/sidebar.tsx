"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Clock, TrendingUp, AlertCircle,
  Bell, Bot, BarChart3, Settings, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timeline", label: "OPT Timeline", icon: Clock },
  { href: "/stem", label: "STEM Extension", icon: TrendingUp },
  { href: "/unemployment", label: "Unemployment", icon: AlertCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card px-3 py-4">
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
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => signOut()}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}
