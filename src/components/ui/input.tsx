import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles - sobre et élégant
        "h-9 w-full min-w-0 px-3 py-1.5 text-sm",
        "bg-muted/30 border border-border/60 rounded-md",
        "text-foreground placeholder:text-muted-foreground/60",
        "transition-all duration-200 ease-in-out",
        "outline-none",
        // File input styles
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:mr-2",
        // Selection styles
        "selection:bg-primary/20 selection:text-foreground",
        // Hover state - background légèrement plus visible
        "hover:bg-muted/40",
        // Focus state - background plus visible
        "focus-visible:bg-muted/50",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/20",
        // Invalid state
        "aria-invalid:border-destructive/60 aria-invalid:ring-destructive/20",
        "dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
