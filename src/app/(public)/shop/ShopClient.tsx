"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { Badge } from "@/components/ui/badge";
import { AdRewardCard } from "@/components/ads/AdRewardCard";
import { ReferralCard } from "@/components/referrals/ReferralCard";

/**
 * 🎯 Page Shop - Design sobre, class et subtilement gamifié
 * Less is more : palette restreinte, animations discrètes, hiérarchie claire
 */
export function ShopClient() {
  const { user, isAuthenticated } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 12, minutes: 34, seconds: 15 });
  const packs = useQuery(api.payments.getAvailablePacks, {});

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Compteur d'urgence (discret)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
              days--;
              if (days < 0) {
                days = 7;
                hours = 12;
                minutes = 34;
                seconds = 15;
              }
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPurchaseCount = (packId: string) => {
    const counts: Record<string, number> = {
      pack_survie: 1247,
      pack_strategie: 3421,
      pack_whale: 892,
    };
    return counts[packId] || Math.floor(Math.random() * 2000) + 500;
  };

  const getStockLeft = (packId: string) => {
    const stocks: Record<string, number> = {
      pack_survie: null,
      pack_strategie: 47,
      pack_whale: 12,
    };
    return stocks[packId] || null;
  };

  const handlePurchase = async (packId: string) => {
    if (!packs || !isAuthenticated) {
      if (!isAuthenticated) {
        toast.error("Connectez-vous pour acheter");
      }
      return;
    }

    setLoading(packId);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast.error(error.message || "Erreur lors de la création de la session de paiement");
      setLoading(null);
    }
  };

  const calculateValueRatio = (price: number, seeds: number) => {
    return seeds / (price / 100);
  };

  if (!packs) {
    return (
      <div className="px-4 py-4 lg:container lg:mx-auto lg:max-w-5xl lg:py-8">
        <div className="grid gap-3 md:gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-64 lg:h-80 bg-muted rounded-xl" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const valueRatios = packs.map(p => calculateValueRatio(p.price, p.seeds));
  const bestValueIndex = valueRatios.indexOf(Math.max(...valueRatios));
  
  const popularPack = packs.find(p => p.id === "pack_strategie");
  const calculateSavings = (pack: typeof packs[0]) => {
    if (!popularPack || pack.id === popularPack.id) return null;
    const popularPricePerSeed = (popularPack.price / 100) / popularPack.seeds;
    const currentPricePerSeed = (pack.price / 100) / pack.seeds;
    const savings = ((popularPricePerSeed - currentPricePerSeed) / popularPricePerSeed) * 100;
    return savings > 0 ? Math.round(savings) : null;
  };

  const getOriginalPrice = (pack: typeof packs[0]) => {
    const discount = pack.id === "pack_strategie" ? 0.20 : 0.15;
    return Math.round((pack.price / 100) / (1 - discount) * 100) / 100;
  };

  return (
    <div className="pb-20 lg:pb-8">
      {/* Banner sobre avec compteur discret */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 pt-4 pb-3 lg:pt-6 lg:pb-4 border-b border-border/30 mb-6 lg:mb-8"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold mb-1 tracking-tight">
                Boutique
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Rechargez vos Seeds pour continuer à trader
              </p>
            </div>
            
            {/* Compteur discret */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-[10px] uppercase tracking-wide">Offre limitée</span>
              <div className="flex items-center gap-1 font-mono">
                <span>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-muted-foreground/50">:</span>
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-muted-foreground/50">:</span>
                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
          
          {/* Social Proof discret */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <SolarIcon icon="users-group-rounded-bold" className="size-3 text-foreground/60" />
              <span>{packs.reduce((sum, p) => sum + getPurchaseCount(p.id), 0).toLocaleString()}+ achats</span>
            </div>
            <span>•</span>
            <span>Livraison instantanée</span>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Section Bonus Progressifs - Sobre */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 lg:mb-8"
        >
          <div className="mb-3 lg:mb-4">
            <h2 className="text-base lg:text-lg font-bold mb-1">Bonus progressifs</h2>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Bonus croissants à chaque achat
            </p>
          </div>
          
          <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide lg:overflow-visible lg:mx-0 lg:px-0">
            <div className="flex gap-3 min-w-max lg:grid lg:grid-cols-4 lg:min-w-0">
              {[
                { percent: 180, icon: "rocket-2-bold", label: "Premier achat", deposit: 1 },
                { percent: 240, icon: "wallet-bold", label: "Deuxième achat", deposit: 2 },
                { percent: 300, icon: "case-bold", label: "Troisième achat", deposit: 3 },
                { percent: 360, icon: "safe-2-bold", label: "Quatrième achat", deposit: 4 },
              ].map((bonus, index) => (
                <motion.div
                  key={bonus.deposit}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="w-[180px] lg:w-auto shrink-0"
                >
                  <Card className={cn(
                    "h-full border border-border/50 bg-card transition-all duration-200",
                    index === 0 && "border-primary/30 bg-primary/5"
                  )}>
                    <CardContent className="p-4 text-center">
                      {/* Icône sobre */}
                      <div className={cn(
                        "size-12 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center",
                        index === 0 && "bg-primary/10"
                      )}>
                        <SolarIcon 
                          icon={bonus.icon as any} 
                          className={cn(
                            "size-6",
                            index === 0 ? "text-primary" : "text-foreground/60"
                          )} 
                        />
                      </div>
                      
                      {/* Pourcentage */}
                      <div className={cn(
                        "text-2xl lg:text-3xl font-bold mb-1",
                        index === 0 ? "text-primary" : "text-foreground"
                      )}>
                        {bonus.percent}%
                      </div>
                      <div className="text-[10px] lg:text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                        Bonus
                      </div>
                      
                      {/* Label */}
                      <div className="text-[10px] lg:text-xs text-muted-foreground">
                        {bonus.label}
                      </div>
                      
                      {/* Badge discret */}
                      <div className="mt-3">
                        <Badge className="bg-muted text-foreground border border-border text-[9px] px-2 py-0.5">
                          Actif
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Packs - Design sobre et class */}
        {isMobile ? (
          <div className="overflow-x-auto -mx-4 px-4 pb-2 mb-6 scrollbar-hide">
            <div className="flex gap-3 min-w-max">
              {packs.map((pack, index) => {
                const isPopular = pack.id === "pack_strategie";
                const isLoading = loading === pack.id;
                const isBestValue = index === bestValueIndex;
                const pricePerSeed = (pack.price / 100) / pack.seeds;
                const savings = calculateSavings(pack);
                const purchaseCount = getPurchaseCount(pack.id);
                const stockLeft = getStockLeft(pack.id);
                const originalPrice = getOriginalPrice(pack);
                const hasDiscount = originalPrice > (pack.price / 100);

                return (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-[280px] shrink-0"
                  >
                    <Card
                      className={cn(
                        "relative overflow-hidden h-full flex flex-col transition-all duration-200",
                        isPopular
                          ? "border-2 border-primary/50 shadow-md bg-card"
                          : "border border-border/50 hover:border-border bg-card"
                      )}
                    >
                      {/* Badge sobre */}
                      {isPopular && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium px-2 py-0.5">
                            Populaire
                          </Badge>
                        </div>
                      )}

                      {isBestValue && !isPopular && (
                        <div className="absolute top-3 right-3 z-10">
                          <Badge className="bg-muted text-foreground border border-border text-[10px] font-medium px-2 py-0.5">
                            Meilleur rapport
                          </Badge>
                        </div>
                      )}

                      {/* Stock limité (discret) */}
                      {stockLeft !== null && stockLeft < 50 && (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-muted/80 text-foreground border border-border text-[10px] font-medium px-2 py-0.5">
                            {stockLeft} restants
                          </Badge>
                        </div>
                      )}

                      <CardContent className="p-4 flex flex-col flex-1">
                        <div className="mb-3">
                          <h3 className="text-base font-bold mb-0.5">{pack.name}</h3>
                          <p className="text-[10px] text-muted-foreground leading-tight">{pack.description}</p>
                        </div>

                        <div className="mb-4 flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <SeedDisplay
                              amount={pack.seeds}
                              variant="default"
                              className="text-3xl font-bold"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {(pricePerSeed * 1000).toFixed(2)}€/1000
                            </p>
                          </div>
                        </div>

                        <div className="mb-3 pt-3 border-t border-border/50">
                          <div className="text-center">
                            {hasDiscount && (
                              <div className="mb-1">
                                <span className="text-xs text-muted-foreground line-through mr-2">
                                  {originalPrice.toFixed(2)}€
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  -{Math.round(((originalPrice - pack.price / 100) / originalPrice) * 100)}%
                                </span>
                              </div>
                            )}
                            <span className="text-2xl font-bold tracking-tight">
                              {(pack.price / 100).toFixed(2)}€
                            </span>
                          </div>
                        </div>

                        <div className="mb-2 text-center">
                          <p className="text-[10px] text-muted-foreground">
                            {purchaseCount.toLocaleString()} achats
                          </p>
                        </div>

                        <Button
                          className={cn(
                            "w-full h-10 text-sm font-medium transition-all",
                            isPopular
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-muted hover:bg-muted/80 border border-border"
                          )}
                          onClick={() => handlePurchase(pack.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <SolarIcon icon="loading-bold" className="size-3.5 mr-2 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            <>
                              <SolarIcon icon="wallet-bold" className="size-3.5 mr-1.5" />
                              Acheter
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {packs.map((pack, index) => {
              const isPopular = pack.id === "pack_strategie";
              const isLoading = loading === pack.id;
              const isBestValue = index === bestValueIndex;
              const pricePerSeed = (pack.price / 100) / pack.seeds;
              const savings = calculateSavings(pack);
              const purchaseCount = getPurchaseCount(pack.id);
              const stockLeft = getStockLeft(pack.id);
              const originalPrice = getOriginalPrice(pack);
              const hasDiscount = originalPrice > (pack.price / 100);

              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={cn(
                    isPopular && "md:scale-[1.02]"
                  )}
                >
                  <Card
                    className={cn(
                      "relative overflow-hidden h-full flex flex-col transition-all duration-200",
                      isPopular
                        ? "border-2 border-primary/50 shadow-lg bg-card"
                        : "border border-border/50 hover:border-border bg-card"
                    )}
                  >
                    {isPopular && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium px-3 py-1">
                          Populaire
                        </Badge>
                      </div>
                    )}

                    {isBestValue && !isPopular && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-muted text-foreground border border-border text-[10px] font-medium px-3 py-1">
                          Meilleur rapport
                        </Badge>
                      </div>
                    )}

                    {savings && savings > 0 && (
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-muted/80 text-foreground border border-border text-[10px] font-medium px-3 py-1">
                          -{savings}%
                        </Badge>
                      </div>
                    )}

                    {stockLeft !== null && stockLeft < 50 && (
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-muted/80 text-foreground border border-border text-[10px] font-medium px-3 py-1">
                          {stockLeft} restants
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="mb-5">
                        <h3 className="text-xl font-bold mb-1.5">{pack.name}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{pack.description}</p>
                      </div>

                      <div className="mb-6 flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <div className="mb-3">
                            <SeedDisplay
                              amount={pack.seeds}
                              variant="default"
                              className="text-5xl font-bold"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(pricePerSeed * 1000).toFixed(2)}€ pour 1000 Seeds
                          </p>
                        </div>
                      </div>

                      <div className="mb-5 pt-5 border-t border-border/50">
                        <div className="text-center">
                          {hasDiscount && (
                            <div className="mb-2">
                              <span className="text-sm text-muted-foreground line-through mr-2">
                                {originalPrice.toFixed(2)}€
                              </span>
                              <span className="text-xs text-muted-foreground">
                                -{Math.round(((originalPrice - pack.price / 100) / originalPrice) * 100)}%
                              </span>
                            </div>
                          )}
                          <span className="text-4xl font-bold tracking-tight">
                            {(pack.price / 100).toFixed(2)}€
                          </span>
                        </div>
                      </div>

                      <div className="mb-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <SolarIcon icon="users-group-rounded-bold" className="size-3 text-foreground/40" />
                          <span>{purchaseCount.toLocaleString()} achats</span>
                        </div>
                      </div>

                      <Button
                        className={cn(
                          "w-full h-12 text-base font-medium transition-all",
                          isPopular
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted hover:bg-muted/80 border border-border"
                        )}
                        onClick={() => handlePurchase(pack.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <SolarIcon icon="loading-bold" className="size-4 mr-2 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          <>
                            <SolarIcon icon="wallet-bold" className="size-4 mr-2" />
                            Acheter maintenant
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Section Gagner des Seeds */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 lg:mt-12 mb-6 lg:mb-8"
        >
          <div className="mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-bold mb-1">Gagner gratuitement</h2>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Obtenez des Seeds sans dépenser
            </p>
          </div>
          
          <div className="grid gap-3 lg:gap-4 lg:grid-cols-2">
            <AdRewardCard />
            <ReferralCard />
          </div>
        </motion.div>

        {/* Trust Section sobre */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t border-border/30"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="size-10 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                <SolarIcon icon="shield-check-bold" className="size-5 text-foreground/60" />
              </div>
              <p className="text-xs font-medium mb-0.5">Paiement sécurisé</p>
              <p className="text-[10px] text-muted-foreground">Stripe SSL</p>
            </div>
            <div className="text-center">
              <div className="size-10 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                <SolarIcon icon="flash-circle-bold" className="size-5 text-foreground/60" />
              </div>
              <p className="text-xs font-medium mb-0.5">Livraison instantanée</p>
              <p className="text-[10px] text-muted-foreground">Seeds crédités immédiatement</p>
            </div>
            <div className="text-center">
              <div className="size-10 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                <SolarIcon icon="refresh-bold" className="size-5 text-foreground/60" />
              </div>
              <p className="text-xs font-medium mb-0.5">Garantie 30 jours</p>
              <p className="text-[10px] text-muted-foreground">Remboursement possible</p>
            </div>
            <div className="text-center">
              <div className="size-10 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                <SolarIcon icon="headphones-round-sound-bold" className="size-5 text-foreground/60" />
              </div>
              <p className="text-xs font-medium mb-0.5">Support 24/7</p>
              <p className="text-[10px] text-muted-foreground">Assistance disponible</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 lg:gap-6 text-[10px] lg:text-xs text-muted-foreground flex-wrap pt-4 border-t border-border/30">
            <div className="flex items-center gap-1">
              <SolarIcon icon="shield-bold" className="size-3 text-foreground/40" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-1">
              <SolarIcon icon="flash-circle-bold" className="size-3 text-foreground/40" />
              <span>Livraison instantanée</span>
            </div>
            <div className="flex items-center gap-1">
              <SolarIcon icon="check-circle-bold" className="size-3 text-foreground/40" />
              <span>Support disponible</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
