"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function ThemeToggle({ 
  variant = "ghost", 
  size = "icon",
  className 
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter le flash de contenu non stylé (hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        disabled
      >
        <SolarIcon icon="sun-bold" className="size-4" />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn("relative", className)}
      aria-label="Changer le thème"
    >
      <SolarIcon 
        icon="sun-bold" 
        className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" 
      />
      <SolarIcon 
        icon="moon-bold" 
        className="size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" 
      />
      <span className="sr-only">Changer le thème</span>
    </Button>
  );
}

