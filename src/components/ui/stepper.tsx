"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";

interface Step {
  id: string;
  label: string;
  icon?: string;
  completed?: boolean;
}

interface StepperProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  // Vérifier si on peut accéder à une étape
  const canAccessStep = (stepIndex: number): boolean => {
    // On peut toujours accéder à l'étape actuelle
    if (stepIndex === currentIndex) return true;
    
    // On peut toujours revenir en arrière (étapes précédentes)
    if (stepIndex < currentIndex) return true;
    
    // Pour les étapes suivantes, on vérifie que toutes les étapes précédentes sont complétées
    for (let i = 0; i < stepIndex; i++) {
      if (!steps[i].completed) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-start">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          // Une étape est complétée seulement si elle est réellement complétée
          const isCompleted = step.completed;
          // État actif uniquement à partir de l'étape 2 (index >= 1)
          const showActiveState = isActive && index >= 1;
          const canAccess = canAccessStep(index);
          const isClickable = onStepClick && canAccess;

          return (
            <React.Fragment key={step.id}>
              {/* Step Container */}
              <div className="flex flex-col items-center flex-1 relative">
                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => {
                    if (isClickable && canAccess) {
                      onStepClick(step.id);
                    }
                  }}
                  disabled={!isClickable}
                  className={cn(
                    "relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200",
                    "border",
                    // État complété (priorité la plus haute)
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    // État actif (uniquement à partir de l'étape 2, ne remplace pas complété)
                    showActiveState && !isCompleted && "bg-background border-primary text-primary ring-2 ring-primary/20",
                    // État par défaut
                    !isCompleted && !showActiveState && "bg-muted border-border text-muted-foreground",
                    isClickable && "cursor-pointer hover:scale-105",
                    !isClickable && "cursor-not-allowed opacity-50"
                  )}
                >
                  {isCompleted ? (
                    <SolarIcon icon="check-circle-bold" className="h-4 w-4" />
                  ) : step.icon ? (
                    <SolarIcon icon={step.icon as any} className={cn(
                      "h-3.5 w-3.5",
                      showActiveState && "text-primary",
                      !showActiveState && "text-muted-foreground"
                    )} />
                  ) : (
                    <span className={cn(
                      "text-xs font-semibold",
                      showActiveState && "text-primary",
                      !showActiveState && "text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                  )}
                </button>
                
                {/* Label */}
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium text-center",
                    showActiveState && "text-foreground",
                    isCompleted && !showActiveState && "text-muted-foreground",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line - Centré verticalement */}
              {index < steps.length - 1 && (
                <div className="flex-1 relative mx-1.5 mt-4">
                  <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2">
                    <div
                      className={cn(
                        "h-full w-full transition-all duration-300",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

