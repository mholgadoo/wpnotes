"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FileText,
  FolderOpen,
  Shield,
  Upload,
  Settings,
  Target,
  Layers,
  BookOpen,
  Archive,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PARA_CONFIG, type ParaCategory } from "@/lib/mock-data";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Notas", icon: FileText },
  { href: "/dashboard/folders", label: "Carpetas", icon: FolderOpen },
  { href: "/dashboard/vault", label: "Bóveda", icon: Shield },
  { href: "/dashboard/upload", label: "Subir", icon: Upload },
  { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
];

const PARA_ITEMS: { category: ParaCategory; icon: typeof Target }[] = [
  { category: "project", icon: Target },
  { category: "area", icon: Layers },
  { category: "resource", icon: BookOpen },
  { category: "archive", icon: Archive },
];

const PARA_DOT_COLORS: Record<ParaCategory, string> = {
  project: "bg-blue-500",
  area: "bg-green-500",
  resource: "bg-amber-500",
  archive: "bg-gray-400",
};

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [paraExpanded, setParaExpanded] = useState(true);

  const activeCategory = searchParams.get("category") as ParaCategory | null;

  function isActive(href: string) {
    if (href === "/dashboard") {
      return (
        (pathname === "/dashboard" && !activeCategory) ||
        pathname.startsWith("/dashboard/notes")
      );
    }
    return pathname.startsWith(href);
  }

  function isParaCategoryActive(cat: ParaCategory) {
    return pathname === "/dashboard" && activeCategory === cat;
  }

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs">
            W
          </div>
          <span>WPNotes</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isFolders = item.href === "/dashboard/folders";

          return (
            <div key={item.href}>
              <div className="flex items-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
                {isFolders && (
                  <button
                    onClick={() => setParaExpanded(!paraExpanded)}
                    className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        !paraExpanded && "-rotate-90"
                      )}
                    />
                  </button>
                )}
              </div>

              {/* PARA sub-navigation */}
              {isFolders && paraExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-accent pl-2">
                  {PARA_ITEMS.map(({ category, icon: ParaIcon }) => {
                    const config = PARA_CONFIG[category];
                    const catActive = isParaCategoryActive(category);
                    return (
                      <Link
                        key={category}
                        href={`/dashboard?category=${category}`}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                          catActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", PARA_DOT_COLORS[category])} />
                        {config.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export { navItems };
