"use client";

import { SolarIcon } from "./SolarIcon";
import { cn } from "@/lib/utils";

interface GradientIconProps {
  icon: string;
  className?: string;
  size?: number;
  variant?: "light" | "active";
}

export function GradientIcon({ icon, className, size = 16, variant = "light" }: GradientIconProps) {
  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center",
        variant === "active" ? "icon-gradient-active" : "icon-gradient-light",
        className
      )}
      style={{
        width: size,
        height: size,
      }}
    >
      <SolarIcon
        icon={icon}
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
}
