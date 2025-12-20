import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-xl bg-card text-muted-foreground transition-all duration-300 hover:text-foreground hover:shadow-premium border border-border/50",
        "group overflow-hidden"
      )}
      aria-label="Toggle theme"
    >
      <Sun className={cn(
        "h-5 w-5 absolute transition-all duration-500",
        theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
      )} />
      <Moon className={cn(
        "h-5 w-5 absolute transition-all duration-500",
        theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
      )} />
    </button>
  );
}
