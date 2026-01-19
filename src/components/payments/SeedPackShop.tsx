"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";

/**
 * 💳 Boutique de packs de Seeds
 * Affiche les 3 packs disponibles avec Stripe Checkout
 */
export function SeedPackShop() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const packs = useQuery(api.payments.getAvailablePacks, {});

  const handlePurchase = async (packId: string) => {
    if (!packs) return;

    setLoading(packId);

    try {
      // Appeler l'API route pour créer la session Stripe
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
        // Rediriger vers Stripe Checkout
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

  if (!packs) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Recharger vos Seeds</h2>
        <p className="text-muted-foreground">
          Choisissez un pack pour recharger votre balance de Seeds
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {packs.map((pack) => {
          const isPopular = pack.id === "pack_strategie";
          const isLoading = loading === pack.id;

          return (
            <Card
              key={pack.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                isPopular ? "border-primary border-2" : ""
              }`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Populaire
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-xl">{pack.name}</CardTitle>
                <CardDescription>{pack.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Seeds</span>
                  <SeedDisplay amount={pack.seeds} variant="default" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prix</span>
                  <span className="text-2xl font-bold">
                    {(pack.price / 100).toFixed(2)}€
                  </span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handlePurchase(pack.id)}
                  disabled={isLoading}
                  variant={isPopular ? "default" : "outline"}
                >
                  {isLoading ? (
                    <>
                      <SolarIcon icon="loading-bold" className="size-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="wallet-bold" className="size-4 mr-2" />
                      Acheter
                    </>
                  )}
                </Button>

                <div className="text-xs text-center text-muted-foreground">
                  Paiement sécurisé par Stripe
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-sm text-muted-foreground text-center">
        <p>
          💳 Paiement sécurisé • 🔒 Vos données sont protégées • ✅ Support Apple Pay & Google Pay
        </p>
      </div>
    </div>
  );
}

