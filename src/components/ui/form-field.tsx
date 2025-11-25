"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  description,
  required = false,
  error,
  children,
  className,
}: FormFieldProps) {
  const fieldId = React.useId();

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label
          htmlFor={fieldId}
          className={cn(
            "text-sm font-medium",
            error && "text-destructive",
            !error && "text-foreground"
          )}
        >
          {label}
          {required && (
            <span className="ml-1 text-destructive" aria-label="requis">
              *
            </span>
          )}
        </Label>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      <div className="space-y-1">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          "aria-invalid": error ? "true" : "false",
          "aria-describedby": error
            ? `${fieldId}-error`
            : description
              ? `${fieldId}-description`
              : undefined,
        })}
        {error && (
          <p
            id={`${fieldId}-error`}
            className="text-xs text-destructive font-medium flex items-center gap-1.5"
            role="alert"
          >
            <span className="text-destructive">•</span>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

