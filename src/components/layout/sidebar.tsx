"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/utils/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Brain,
  LayoutDashboard,
  Rss,
  Swords,
  Newspaper,
  BarChart3,
  Shield,
  Database,
  Settings,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Rss,
  Brain,
  Swords,
  Newspaper,
  BarChart3,
  Shield,
  Database,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 text-white z-30">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">PeptideIQ</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = iconMap[item.icon];

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar size="sm">
              <AvatarFallback className="bg-indigo-600 text-white text-xs">
                AD
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">
                Andrei Dutescu
              </span>
              <span className="text-xs text-slate-400 truncate">
                andrei@peptideiq.com
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
