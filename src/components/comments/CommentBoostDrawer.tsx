"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface CommentBoostDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  argumentId: Id<"topArguments">;
  currentBid: number;
  minBoost: number;
  userSeedsBalance: number;
  onBoost: (argumentId: Id<"topArguments">, amount: number) => Promise<void>;
}

export function CommentBoostDrawer({
  open,
  onOpenChange,
  argumentId,
  currentBid,
  minBoost,
  userSeedsBalance,
  onBoost,
}: CommentBoostDrawerProps) {
  const [boostAmount, setBoostAmount] = useState<number>(minBoost);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setBoostAmount(minBoost);
    }
  }, [open, minBoost]);

  const handleBoost = async () => {
    if (boostAmount < minBoost || userSeedsBalance < boostAmount) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onBoost(argumentId, boostAmount);
      onOpenChange(false);
    } catch (error) {
      // L'erreur est gérée par le parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const canBoost = boostAmount >= minBoost && userSeedsBalance >= boostAmount && !isSubmitting;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="bottom">
      <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full">
        <div className="relative h-full flex flex-col overflow-hidden w-full max-w-full min-w-0 bg-background">
          {/* Header */}
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/20 shrink-0">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <SolarIcon icon="crown-bold" className="size-5 text-primary" />
              Booster ce commentaire
            </SheetTitle>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {currentBid > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Investissement actuel</p>
                <p className="text-sm font-semibold">
                  <SeedDisplay amount={currentBid} variant="inline" iconSize="size-3" />
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium block">
                Montant à investir
              </label>
              <Input
                type="number"
                min={minBoost}
                value={boostAmount}
                onChange={(e) => setBoostAmount(Number(e.target.value))}
                placeholder={`Minimum: ${minBoost}`}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                Minimum requis : <SeedDisplay amount={minBoost} variant="inline" iconSize="size-2.5" />
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Vos Seeds disponibles</p>
              <p className={cn(
                "text-sm font-semibold",
                userSeedsBalance < boostAmount ? "text-red-500" : "text-foreground"
              )}>
                <SeedDisplay amount={userSeedsBalance} variant="inline" iconSize="size-3" />
              </p>
            </div>

            {userSeedsBalance < boostAmount && (
              <p className="text-xs text-red-500">
                Vous n'avez pas assez de Seeds pour ce montant.
              </p>
            )}
          </div>

          {/* Footer */}
          <SheetFooter className="px-4 pb-6 pt-4 shrink-0 border-t border-border/20">
            <Button
              onClick={handleBoost}
              disabled={!canBoost}
              className={cn(
                "w-full h-12 text-sm font-bold rounded-xl",
                "bg-linear-to-r from-primary via-primary to-primary/90 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <SolarIcon icon="crown-bold" className="size-4 mr-2" />
              Booster pour <SeedDisplay amount={boostAmount} variant="inline" iconSize="size-3" className="ml-1" />
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

