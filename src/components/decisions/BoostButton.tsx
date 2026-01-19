"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import Image from "next/image";
import { BoostSuccessModal } from "@/components/ui/BoostSuccessModal";
import Link from "next/link";

interface BoostButtonProps {
  decisionId: Id<"decisions">;
  className?: string;
}

/**
 * Formate un montant de Seeds pour l'affichage
 */
function formatSeedAmount(amount: number): string {
  const absVal = Math.abs(amount);
  
  if (absVal >= 1000000) {
    const mValue = amount / 1000000;
    return `${mValue.toFixed(absVal >= 10000000 ? 1 : 2)}M`;
  }
  
  if (absVal >= 1000) {
    const kValue = amount / 1000;
    return `${kValue.toFixed(absVal >= 10000 ? 1 : 2)}K`;
  }
  
  if (absVal >= 1) {
    return amount.toFixed(absVal >= 10 ? 1 : 2);
  }
  
  return amount.toFixed(2);
}

/**
 * 🎯 FEATURE 4: LE MÉGAPHONE - Bouton pour booster une décision
 */
export function BoostButton({ decisionId, className }: BoostButtonProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const justBoostedRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  const activeBoosts = useQuery(api.decisionBoosts.getActiveBoosts, {
    decisionId,
  });
  const totalBoostTime = useQuery(api.decisionBoosts.getTotalBoostTimeRemaining, { decisionId });

  const boostDecision = useMutation(api.decisionBoosts.boostDecision);

  const BOOST_COST = 500;
  const hasEnoughSeeds = (user?.seedsBalance || 0) >= BOOST_COST;
  const isBoosted = activeBoosts && activeBoosts.length > 0;
  const latestBoost = activeBoosts?.[0];

  // Gérer l'affichage de la modale de succès après un boost
  useEffect(() => {
    if (justBoostedRef.current && isBoosted && !isSuccessOpen) {
      // Si on vient de booster et que le boost est actif, afficher la modale
      const timer = setTimeout(() => {
        setIsSuccessOpen(true);
        justBoostedRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isBoosted, isSuccessOpen]);

  const handleBoost = async () => {
    if (!hasEnoughSeeds) {
      toast.error(`Vous n'avez pas assez de Seeds. Vous avez ${user?.seedsBalance || 0}, mais vous devez payer ${BOOST_COST}.`);
      return;
    }

    try {
      await boostDecision({ decisionId });
      setIsOpen(false);
      justBoostedRef.current = true;
      // Le useEffect gérera l'affichage de la modale quand isBoosted sera mis à jour
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de booster la décision.",
      });
    }
  };

  // Calculer le temps restant pour l'affichage avec compteur en temps réel
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  useEffect(() => {
    if (isBoosted) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000); // Mise à jour toutes les secondes
      return () => clearInterval(interval);
    }
  }, [isBoosted]);

  const timeRemaining = totalBoostTime 
    ? totalBoostTime.expiresAt - currentTime
    : (latestBoost ? latestBoost.expiresAt - currentTime : 0);
  
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (60 * 60 * 1000)));
  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000)));
  const secondsRemaining = Math.max(0, Math.floor((timeRemaining % (60 * 1000)) / 1000));

  if (isBoosted && latestBoost) {
    // Afficher le badge "Mis à la une" mais permettre toujours de surenchérir
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen} side={isMobile ? "bottom" : "right"}>
          <SheetTrigger asChild>
            <Badge variant="outline" className={cn("gap-1.5 cursor-pointer hover:bg-primary/10 transition-colors", className)}>
              <img 
                src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" 
                alt="Rocket" 
                width="14" 
                height="14"
                className="shrink-0"
              />
              <span className="text-xs flex items-center gap-1.5">
                Mis à la une
                {latestBoost.user?.name && (
                  <>
                    {" par "}
                    {latestBoost.user?.image && (
                      <img
                        src={latestBoost.user.image}
                        alt={latestBoost.user.name}
                        className="size-4 rounded-full shrink-0"
                      />
                    )}
                    {latestBoost.user?.username ? (
                      <Link
                        href={`/u/${latestBoost.user.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-primary hover:underline inline-flex items-center"
                      >
                        {latestBoost.user.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-primary">{latestBoost.user.name}</span>
                    )}
                  </>
                )}
              </span>
              {timeRemaining > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({hoursRemaining > 0 ? `${hoursRemaining.toString().padStart(2, '0')}:` : ""}{minutesRemaining.toString().padStart(2, '0')}:{secondsRemaining.toString().padStart(2, '0')})
                </span>
              )}
              {totalBoostTime && totalBoostTime.totalBoosts > 1 && (
                <span className="text-[10px] text-primary">
                  (+{totalBoostTime.totalBoosts - 1} boost{totalBoostTime.totalBoosts > 2 ? "s" : ""})
                </span>
              )}
            </Badge>
          </SheetTrigger>
          <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[70vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full" : ""}>
            <div className={cn("relative", isMobile ? "h-full flex flex-col overflow-hidden w-full max-w-full min-w-0 bg-background" : "")}>
              {/* Cover progressif partout */}
              {decision?.imageUrl && (
                <div className="absolute inset-0 z-0">
                  <Image
                    src={decision.imageUrl}
                    alt={decision.title || "Décision"}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-background from-20% via-background/95 to-background" />
                </div>
              )}

              {/* Contenu avec z-index relatif */}
              <div className={cn("relative z-10", isMobile ? "flex flex-col h-full overflow-hidden max-w-full" : "p-6")}>
                {/* Header compact */}
                <div className={cn("shrink-0", isMobile ? "px-4 pt-6 pb-4" : "mb-4")}>
                  <SheetHeader className="p-0">
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" 
                        alt="Rocket" 
                        width="48" 
                        height="48"
                        className="shrink-0"
                      />
                      <SheetTitle className="text-lg font-bold">
                        {isBoosted ? "Surenchérir" : "Booster"} cette décision
                      </SheetTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isBoosted && totalBoostTime ? (
                        <>
                          Ajoutez 1h au boost existant
                          <br />
                          <span className="text-xs text-primary font-medium">
                            Temps restant actuel : {totalBoostTime.hoursRemaining > 0 ? `${totalBoostTime.hoursRemaining}h ` : ""}{totalBoostTime.minutesRemaining}min
                          </span>
                        </>
                      ) : (
                        "Propulsez cette décision en haut du feed pendant 1 heure"
                      )}
                    </p>
                  </SheetHeader>
                </div>

                {/* Contenu scrollable */}
                <div className={cn(isMobile ? "flex-1 overflow-y-auto overflow-x-hidden px-4 pb-20 space-y-4 max-w-full" : "space-y-4")}>
                  {/* Informations de boost */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-xs text-muted-foreground font-medium">Coût</span>
                      <div className="flex items-center gap-1">
                        <SolarIcon icon="leaf-bold" className="size-3 text-primary shrink-0" />
                        <span className="text-sm font-bold">{formatSeedAmount(BOOST_COST)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-xs text-muted-foreground font-medium">Durée ajoutée</span>
                      <span className="text-sm font-semibold">1 heure</span>
                    </div>
                    {isBoosted && totalBoostTime && (
                      <div className="flex items-center justify-between py-2 border-b border-border/20">
                        <span className="text-xs text-muted-foreground font-medium">Temps total après</span>
                        <span className="text-sm font-semibold text-primary">
                          {totalBoostTime.hoursRemaining + 1 > 0 ? `${totalBoostTime.hoursRemaining + 1}h ` : ""}{totalBoostTime.minutesRemaining}min
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-xs text-muted-foreground font-medium">Vos Seeds</span>
                      <div className="flex items-center gap-1">
                        <SolarIcon icon="leaf-bold" className="size-3 text-primary shrink-0" />
                        <span className={cn(
                          "text-sm font-bold",
                          hasEnoughSeeds ? "text-primary" : "text-red-500"
                        )}>
                          {formatSeedAmount(user?.seedsBalance || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!hasEnoughSeeds && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-500">
                        Il vous manque{" "}
                        <span className="font-bold">
                          {formatSeedAmount(BOOST_COST - (user?.seedsBalance || 0))} Seeds
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer avec bouton */}
                {isMobile && (
                  <SheetFooter className="px-4 pb-6 pt-4 shrink-0 border-t border-border/20">
                    <Button
                      onClick={handleBoost}
                      disabled={!hasEnoughSeeds}
                      className={cn(
                        "w-full h-12 text-sm font-bold rounded-xl transition-all",
                        hasEnoughSeeds
                          ? "bg-gradient-to-r from-primary via-primary/90 to-primary hover:opacity-90 text-white"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      <SolarIcon icon="megaphone-bold" className="size-4 mr-2" />
                      {isBoosted ? "Surenchérir" : "Booster"} pour {formatSeedAmount(BOOST_COST)} Seeds
                    </Button>
                  </SheetFooter>
                )}
                {!isMobile && (
                  <div className="mt-4">
                    <Button
                      onClick={handleBoost}
                      disabled={!hasEnoughSeeds}
                      className="w-full"
                      size="lg"
                    >
                      <SolarIcon icon="megaphone-bold" className="size-4 mr-2" />
                      {isBoosted ? "Surenchérir" : "Booster"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        {/* Modale de succès - toujours rendue pour pouvoir s'afficher */}
        <BoostSuccessModal
          open={isSuccessOpen}
          onOpenChange={setIsSuccessOpen}
          decisionTitle={decision?.title}
        />
      </>
    );
  }

  return (
    <>
      {/* Sur mobile, utiliser Sheet */}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen} side="bottom">
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3", className)}
            disabled={!user || !hasEnoughSeeds}
          >
            <span className="whitespace-nowrap inline-flex items-center gap-1">
              Booster pour <SeedDisplay amount={BOOST_COST} variant="inline" iconSize="size-2.5 sm:size-3" className="inline-flex items-center" />
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full">
          <div className="relative h-full flex flex-col overflow-hidden w-full max-w-full min-w-0 bg-background">
            {/* Cover progressif partout */}
            {decision?.imageUrl && (
              <div className="absolute inset-0 z-0">
                <Image
                  src={decision.imageUrl}
                  alt={decision.title || "Décision"}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background from-20% via-background/95 to-background" />
              </div>
            )}

            {/* Contenu avec z-index relatif */}
            <div className="relative z-10 flex flex-col h-full overflow-hidden max-w-full">
              {/* Header compact */}
              <div className="px-4 pt-6 pb-4 shrink-0">
                <SheetHeader className="p-0">
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" 
                      alt="Rocket" 
                      width="48" 
                      height="48"
                      className="shrink-0"
                    />
                    <SheetTitle className="text-lg font-bold">
                      Booster cette décision
                    </SheetTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isBoosted && totalBoostTime ? (
                      <>
                        Surenchérir pour ajouter 1h au boost existant
                        <br />
                        <span className="text-xs text-primary font-medium">
                          Temps restant actuel : {totalBoostTime.hoursRemaining > 0 ? `${totalBoostTime.hoursRemaining}h ` : ""}{totalBoostTime.minutesRemaining}min
                        </span>
                      </>
                    ) : (
                      "Propulsez cette décision en haut du feed pendant 1 heure"
                    )}
                  </p>
                </SheetHeader>
              </div>

              {/* Contenu scrollable */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-20 space-y-4 max-w-full">
                {/* Informations de boost */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/20">
                    <span className="text-xs text-muted-foreground font-medium">Coût</span>
                    <div className="flex items-center gap-1">
                      <SolarIcon icon="leaf-bold" className="size-3 text-primary shrink-0" />
                      <span className="text-sm font-bold">{formatSeedAmount(BOOST_COST)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/20">
                    <span className="text-xs text-muted-foreground font-medium">Durée</span>
                    <span className="text-sm font-semibold">1 heure</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground font-medium">Vos Seeds</span>
                    <div className="flex items-center gap-1">
                      <SolarIcon icon="leaf-bold" className="size-3 text-primary shrink-0" />
                      <span className={cn(
                        "text-sm font-bold",
                        hasEnoughSeeds ? "text-primary" : "text-red-500"
                      )}>
                        {formatSeedAmount(user?.seedsBalance || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {!hasEnoughSeeds && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-500">
                      Il vous manque{" "}
                      <span className="font-bold">
                        {formatSeedAmount(BOOST_COST - (user?.seedsBalance || 0))} Seeds
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Footer avec bouton */}
              <SheetFooter className="px-4 pb-6 pt-4 shrink-0 border-t border-border/20">
                <Button
                  onClick={handleBoost}
                  disabled={!hasEnoughSeeds}
                  className={cn(
                    "w-full h-12 text-sm font-bold rounded-xl transition-all",
                    hasEnoughSeeds
                      ? "bg-gradient-to-r from-primary via-primary/90 to-primary hover:opacity-90 text-white"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <SolarIcon icon="megaphone-bold" className="size-4 mr-2" />
                  Booster pour {formatSeedAmount(BOOST_COST)} Seeds
                </Button>
              </SheetFooter>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1.5 text-xs px-3", className)}
          disabled={!user || !hasEnoughSeeds}
        >
          <span className="whitespace-nowrap inline-flex items-center gap-1">
            Booster pour <SeedDisplay amount={BOOST_COST} variant="inline" iconSize="size-3" className="inline-flex items-center" />
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SolarIcon icon="megaphone-bold" className="size-5 text-primary" />
            Booster cette décision
          </DialogTitle>
          <DialogDescription>
            {isBoosted && totalBoostTime ? (
              <>
                Payez <SeedDisplay amount={BOOST_COST} variant="inline" /> pour ajouter 1h au boost existant.
                <br />
                <span className="text-xs text-primary font-medium mt-1 block">
                  Temps restant actuel : {totalBoostTime.hoursRemaining > 0 ? `${totalBoostTime.hoursRemaining}h ` : ""}{totalBoostTime.minutesRemaining}min
                </span>
              </>
            ) : (
              <>
                Payez <SeedDisplay amount={BOOST_COST} variant="inline" /> pour propulser cette décision en haut du feed de tous les utilisateurs pendant 1 heure.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Coût</span>
              <SeedDisplay amount={BOOST_COST} variant="default" className="text-lg" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Durée</span>
              <span className="text-sm">1 heure</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Vos Seeds</span>
              <SeedDisplay 
                amount={user?.seedsBalance || 0} 
                variant="default" 
                className={cn(
                  "text-sm",
                  hasEnoughSeeds ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              />
            </div>
          </div>

          {!hasEnoughSeeds && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                Vous n'avez pas assez de Seeds. Il vous manque <SeedDisplay amount={BOOST_COST - (user?.seedsBalance || 0)} variant="inline" />.
              </p>
            </div>
          )}

          <Button
            onClick={handleBoost}
            disabled={!hasEnoughSeeds}
            className="w-full"
            size="lg"
          >
            <SeedDisplay amount={BOOST_COST} variant="compact" iconSize="size-3.5" />
            <span className="ml-1">Booster</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
      )}

      {/* Modale de succès */}
      <BoostSuccessModal
        open={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        decisionTitle={decision?.title}
      />
    </>
  );
}
