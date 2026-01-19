"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SaveButton } from "./SaveButton";
import { EventBadge } from "./EventBadge";
import { TradingInterface } from "./TradingInterface";
import { TradingInterfaceReels } from "./TradingInterfaceReels";
import { useTranslations } from 'next-intl';
import { TopArgumentsList } from "./TopArgumentsList";
import { VoteSkinShop } from "@/components/vote-skins/VoteSkinShop";
import { RelatedNewsClient } from "./RelatedNewsClient";

interface DecisionDetailProps {
  decisionId: Id<"decisions">;
  className?: string;
}

const statusColors: Record<string, string> = {
  announced: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  tracking: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  resolved: "bg-green-500/10 text-green-600 dark:text-green-400",
};

export function DecisionDetail({
  decisionId,
  className,
}: DecisionDetailProps) {
  const t = useTranslations('decisions');
  const [isMobile, setIsMobile] = useState(false);
  const decision = useQuery(api.decisions.getDecisionById, {
    decisionId,
  });

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const typeLabels: Record<string, string> = {
    law: t('types.law'),
    sanction: t('types.sanction'),
    tax: t('types.tax'),
    agreement: t('types.agreement'),
    policy: t('types.policy'),
    regulation: t('types.regulation'),
    crisis: t('types.crisis'),
    disaster: t('types.disaster'),
    conflict: t('types.conflict'),
    discovery: t('types.discovery'),
    election: t('types.election'),
    economic_event: t('types.economic_event'),
    other: t('types.other'),
  };

  const statusLabels: Record<string, string> = {
    announced: t('announced'),
    tracking: t('tracking'),
    resolved: t('resolved'),
  };

  if (decision === undefined) {
    return (
      <div className={className}>
        <Skeleton className="aspect-video w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (decision === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <SolarIcon name="document" className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('detail.notFound')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('detail.notFoundDescription')}
        </p>
        <Link href="/">
          <Button variant="outline">{t('detail.backToDecisions')}</Button>
        </Link>
      </div>
    );
  }


  return (
    <div className={cn("space-y-4 pb-24", className)}>
      {/* Image */}
      {decision.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={decision.imageUrl}
            alt={decision.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Header allégé */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <EventBadge
            impactLevel={decision.impactLevel}
            emoji={decision.emoji}
            heat={decision.heat}
            sentiment={decision.sentiment}
            badgeColor={decision.badgeColor}
            size="sm"
          />
          <Badge variant="secondary" className="text-xs">{typeLabels[decision.type]}</Badge>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold leading-tight">{decision.title}</h1>
      </div>

      {/* Trading Interface - Style reels sur mobile, classique sur desktop */}
      {decision.status !== "resolved" && (
        <>
          {isMobile ? (
            <TradingInterfaceReels
              decisionId={decision._id}
              question={decision.question}
              answer1={decision.answer1}
              status={decision.status}
            />
          ) : (
            <>
              <TradingInterface
                decisionId={decision._id}
                question={decision.question}
                answer1={decision.answer1}
                status={decision.status}
              />
              {/* Commentaires - Desktop uniquement */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <SolarIcon icon="chat-round-bold" className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold">Commentaires</h2>
                </div>
                <TopArgumentsList decisionId={decision._id} />
              </div>
            </>
          )}
        </>
      )}

      {/* Actualités liées (client-side via RSS) */}
      <RelatedNewsClient decisionId={decision._id} />

      {/* Résolution */}
      {decision.resolution && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SolarIcon name="check-circle" className="size-5 text-green-600" />
              {t('detail.resolution')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">{t('detail.result')}</p>
              <Badge className={cn(statusColors[decision.resolution.issue])}>
                {statusLabels[decision.resolution.issue]}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">{t('detail.confidence')}</p>
              <p className="text-sm text-muted-foreground">
                {decision.resolution.confidence}%
              </p>
            </div>
            {decision.resolution.variations && decision.resolution.variations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{t('detail.indicatorVariations')}</p>
                <div className="space-y-2">
                  {decision.resolution.variations.map((variation, index) => (
                    <div
                      key={index}
                      className="p-2 rounded border bg-background text-xs"
                    >
                      <p className="font-medium">{variation.variationPercent > 0 ? "+" : ""}
                        {variation.variationPercent.toFixed(2)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}

