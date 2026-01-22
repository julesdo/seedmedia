"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  progressColor?: string; // Couleur personnalisée pour le progress
  bgColor?: string; // Couleur personnalisée pour le background
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  className,
  progressColor,
  bgColor,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor || "currentColor"}
          strokeWidth={strokeWidth}
          fill="none"
          className={bgColor ? "" : "text-border opacity-40"}
          style={bgColor ? { opacity: 0.2 } : undefined}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor || "currentColor"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={progressColor ? "" : "text-primary transition-all duration-300"}
          style={progressColor ? { transition: "all 0.3s ease" } : undefined}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

