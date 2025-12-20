import { Bell, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex h-20 items-center justify-between px-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search anything..."
              className="w-72 pl-11 h-11 rounded-xl bg-muted/50 border-0 focus:bg-card focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-card text-muted-foreground transition-all duration-300 hover:text-foreground hover:shadow-premium border border-border/50 hover:-translate-y-0.5">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse">
              3
            </span>
          </button>

          {/* Settings */}
          <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-card text-muted-foreground transition-all duration-300 hover:text-foreground hover:shadow-premium border border-border/50 hover:-translate-y-0.5">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
