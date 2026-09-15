"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const currentTheme = mounted ? (resolvedTheme || theme) : "light";
  const isDark = currentTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="تغییر تم"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/70 text-foreground transition-all ${className || ""}`}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 dark:text-muted-foreground" />
      )}
    </Button>
  );
}
