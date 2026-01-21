"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { SeedDisplay } from "@/components/ui/SeedDisplay";

interface OrderBookProps {
  decisionId: Id<"decisions">;
}

/**
 * Order Book style Polymarket
 * Affiche les ordres d'achat (bids) et de vente (asks) basés sur les transactions récentes
 */
export function OrderBook({ decisionId }: OrderBookProps) {
  const tradingHistory = useQuery(api.trading.getTradingHistory, { 
    decisionId, 
    limit: 100 
  });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId });
  const probability = useQuery(api.trading.getSingleOdds, { decisionId });

  // Calculer les meilleurs prix actuels
  const currentPriceYes = tradingPools?.yes?.currentPrice ?? (probability !== undefined ? probability : 50);
  const currentPriceNo = tradingPools?.no?.currentPrice ?? (probability !== undefined ? 100 - probability : 50);

  // Grouper les transactions par prix pour créer un Order Book simulé
  const asks: Array<{ price: number; shares: number; total: number; position: "yes" | "no" }> = [];
  const bids: Array<{ price: number; shares: number; total: number; position: "yes" | "no" }> = [];

  if (tradingHistory) {
    // Grouper les transactions récentes par prix normalisé
    const asksMap = new Map<number, { shares: number; total: number; position: "yes" | "no" }>();
    const bidsMap = new Map<number, { shares: number; total: number; position: "yes" | "no" }>();

    tradingHistory.forEach((tx) => {
      const price = tx.pricePerShareNormalized ?? (tx.position === "yes" ? currentPriceYes : currentPriceNo);
      const roundedPrice = Math.round(price * 10) / 10; // Arrondir à 0.1 près

      if (tx.type === "sell") {
        // Les ventes sont des asks (offres de vente)
        const existing = asksMap.get(roundedPrice);
        if (existing) {
          existing.shares += tx.shares;
          existing.total += tx.cost;
        } else {
          asksMap.set(roundedPrice, {
            shares: tx.shares,
            total: tx.cost,
            position: tx.position,
          });
        }
      } else if (tx.type === "buy") {
        // Les achats sont des bids (offres d'achat)
        const existing = bidsMap.get(roundedPrice);
        if (existing) {
          existing.shares += tx.shares;
          existing.total += tx.cost;
        } else {
          bidsMap.set(roundedPrice, {
            shares: tx.shares,
            total: tx.cost,
            position: tx.position,
          });
        }
      }
    });

    // Convertir en tableaux et trier
    asksMap.forEach((value, price) => {
      asks.push({ price, ...value });
    });
    bidsMap.forEach((value, price) => {
      bids.push({ price, ...value });
    });

    // Trier : asks par prix croissant (du plus bas au plus haut)
    asks.sort((a, b) => a.price - b.price);
    // Trier : bids par prix décroissant (du plus haut au plus bas)
    bids.sort((a, b) => b.price - a.price);
  }

  // Calculer le spread (différence entre le meilleur ask et le meilleur bid)
  const bestAsk = asks[0];
  const bestBid = bids[0];
  const spread = bestAsk && bestBid ? bestAsk.price - bestBid.price : 0;
  const lastPrice = tradingHistory?.[0]?.pricePerShareNormalized ?? currentPriceYes;

  return (
    <div className="w-full h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-foreground">Order Book</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div>
            <span className="text-muted-foreground/70">Last: </span>
            <span className="font-semibold text-foreground">{lastPrice.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground/70">Spread: </span>
            <span className="font-semibold text-foreground">{spread.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-0">
          {/* Header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
            PRICE
          </div>
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-2 text-xs font-semibold text-muted-foreground text-right">
            SHARES
          </div>
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-2 text-xs font-semibold text-muted-foreground text-right">
            TOTAL
          </div>

          {/* Asks (Ventes) - Prix croissant */}
          {asks.length > 0 ? (
            asks.slice(0, 20).map((ask, index) => (
              <div key={`ask-${index}`} className="contents">
                <div
                  className={cn(
                    "px-4 py-1.5 text-sm",
                    ask.position === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light
                  )}
                >
                  {ask.price.toFixed(1)}%
                </div>
                <div className="px-4 py-1.5 text-sm text-right text-foreground">
                  {ask.shares.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
                </div>
                <div className="px-4 py-1.5 text-sm text-right text-foreground">
                  <SeedDisplay
                    amount={ask.total}
                    variant="default"
                    className="text-sm"
                    iconSize="size-3"
                    showIcon={false}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune vente récente
            </div>
          )}

          {/* Séparateur */}
          {(asks.length > 0 || bids.length > 0) && (
            <div className="col-span-3 h-px bg-border/50 my-1" />
          )}

          {/* Bids (Achats) - Prix décroissant */}
          {bids.length > 0 ? (
            bids.slice(0, 20).map((bid, index) => (
              <div key={`bid-${index}`} className="contents">
                <div
                  className={cn(
                    "px-4 py-1.5 text-sm",
                    bid.position === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light
                  )}
                >
                  {bid.price.toFixed(1)}%
                </div>
                <div className="px-4 py-1.5 text-sm text-right text-foreground">
                  {bid.shares.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
                </div>
                <div className="px-4 py-1.5 text-sm text-right text-foreground">
                  <SeedDisplay
                    amount={bid.total}
                    variant="default"
                    className="text-sm"
                    iconSize="size-3"
                    showIcon={false}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 px-4 py-8 text-center text-sm text-muted-foreground">
              Aucun achat récent
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

