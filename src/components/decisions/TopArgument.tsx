"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { SeedDisplay } from "@/components/ui/SeedDisplay";

interface TopArgumentProps {
  decisionId: Id<"decisions">;
  position: "works" | "partial" | "fails";
}

/**
 * 🎯 FEATURE 3: Commentaires en vedette - Zone de commentaires
 */
export function TopArgument({ decisionId, position }: TopArgumentProps) {
  const { user } = useUser();
  const [bidAmount, setBidAmount] = useState<number>(50);
  const [content, setContent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const topArgument = useQuery(api.topArguments.getTopArgument, {
    decisionId,
    position,
  });

  const bidOnArgument = useMutation(api.topArguments.bidOnArgument);

  const positionLabels = {
    works: "OUI",
    partial: "PARTIEL",
    fails: "NON",
  };

  const positionColors = {
    works: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    partial: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    fails: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };

  const handleBid = async () => {
    if (!content.trim()) {
      toast.error("Veuillez écrire un argument");
      return;
    }

    if (bidAmount < 1) {
      toast.error("Le montant doit être d'au moins 1");
      return;
    }

    if (topArgument && bidAmount <= topArgument.currentBid) {
      toast.error(`Vous devez investir plus que ${topArgument.currentBid} pour mettre votre commentaire en vedette`);
      return;
    }

    if ((user?.seedsBalance || 0) < bidAmount) {
      toast.error(`Vous n'avez pas assez de Seeds. Vous avez ${user?.seedsBalance || 0}.`);
      return;
    }

    try {
      await bidOnArgument({
        decisionId,
        position,
        content: content.trim(),
        bidAmount,
      });

      toast.success("Commentaire publié !", {
        description: `Vous avez investi ${bidAmount} pour mettre votre commentaire en vedette.`,
      });

      setContent("");
      setBidAmount(50);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de publier le commentaire.",
      });
    }
  };

  if (topArgument === undefined) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <Card className={cn("border-2", positionColors[position])}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <SolarIcon icon="crown-bold" className="size-4" />
            Commentaire en vedette - {positionLabels[position]}
          </CardTitle>
          {topArgument && (
            <Badge variant="outline" className="text-xs font-bold">
              <SeedDisplay amount={topArgument.currentBid} variant="compact" iconSize="size-2.5" />
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {topArgument ? (
          <>
            {/* Argument actuel */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={topArgument.user?.image} />
                  <AvatarFallback>
                    {topArgument.user?.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold">
                      {topArgument.user?.name || "Anonyme"}
                    </p>
                    <Badge variant="outline" className="text-[10px]">
                      <SeedDisplay amount={topArgument.currentBid} variant="compact" iconSize="size-2.5" />
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {topArgument.content}
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton pour commenter */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!user}
                >
                  <SeedDisplay amount={topArgument.currentBid + 1} variant="compact" iconSize="size-3" />
                  <span className="ml-1">Commenter</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Commenter et mettre en vedette</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Votre argument
                    </label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Écrivez votre argument..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Montant à investir
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={topArgument.currentBid + 1}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border rounded-lg"
                        placeholder={`Minimum: ${topArgument.currentBid + 1}`}
                      />
                      <Button onClick={handleBid} disabled={!content.trim() || bidAmount <= topArgument.currentBid}>
                        <SeedDisplay amount={bidAmount} variant="compact" iconSize="size-3" />
                        <span className="ml-1">Publier</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vous avez <SeedDisplay amount={user?.seedsBalance || 0} variant="inline" iconSize="size-2.5" /> disponibles
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <>
            {/* Aucun commentaire - Premier à commenter */}
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Aucun commentaire pour cette position. Soyez le premier !
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!user}>
                    <SeedDisplay amount={50} variant="compact" iconSize="size-3" />
                    <span className="ml-1">Publier un commentaire</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Publier un commentaire</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Votre argument
                      </label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Écrivez votre argument..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Montant à investir
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={50}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          placeholder="Minimum: 50"
                        />
                        <Button onClick={handleBid} disabled={!content.trim() || bidAmount < 50}>
                          <SeedDisplay amount={bidAmount} variant="compact" iconSize="size-3" />
                          <span className="ml-1">Publier</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vous avez <SeedDisplay amount={user?.seedsBalance || 0} variant="inline" iconSize="size-2.5" /> disponibles
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

