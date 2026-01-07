"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { SaveButton } from "./SaveButton";
import { EventBadge } from "./EventBadge";
import { useTranslations } from 'next-intl';

interface DecisionCardProps {
  decision: {
    _id: Id<"decisions">;
    title: string;
    slug: string;
    decider: string;
    deciderType: "country" | "institution" | "leader" | "organization";
    date: number;
    type: "law" | "sanction" | "tax" | "agreement" | "policy" | "regulation" | "crisis" | "disaster" | "conflict" | "discovery" | "election" | "economic_event" | "other";
    impactedDomains: string[];
    imageUrl?: string;
    status: "announced" | "tracking" | "resolved";
    anticipationsCount: number;
    question: string;
    answer1: string;
    answer2: string;
    answer3: string;
    sentiment: "positive" | "negative" | "neutral";
    heat: number;
    emoji: string;
    badgeColor: string;
  };
  className?: string;
}

const statusColors: Record<DecisionCardProps["decision"]["status"], string> = {
  announced: "text-blue-600 dark:text-blue-400",
  tracking: "text-orange-600 dark:text-orange-400",
  resolved: "text-green-600 dark:text-green-400",
};

export function DecisionCard({
  decision,
  className,
}: DecisionCardProps) {
  const t = useTranslations('decisions');
  const decisionDate = new Date(decision.date);
  const timeAgo = formatDistanceToNow(decisionDate, { addSuffix: true });

  const typeLabels: Record<DecisionCardProps["decision"]["type"], string> = {
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

  const statusLabels: Record<DecisionCardProps["decision"]["status"], string> = {
    announced: t('announced'),
    tracking: t('tracking'),
    resolved: t('resolved'),
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden bg-background border-b border-border/50",
        className
      )}
    >
      {/* Header simplifié */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <Link href={`/${decision.slug}`} className="flex items-center gap-2 flex-1 min-w-0">
          <EventBadge
            emoji={decision.emoji}
            heat={decision.heat}
            sentiment={decision.sentiment}
            badgeColor={decision.badgeColor}
            size="sm"
          />
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs px-2 py-0.5",
              statusColors[decision.status]
            )}
          >
            {statusLabels[decision.status]}
          </Badge>
          <span className="text-sm text-muted-foreground truncate">
            {decision.decider}
          </span>
        </Link>
        <SaveButton decisionId={decision._id} size="icon" />
      </div>

      {/* Image pleine largeur - Style Instagram */}
      {decision.imageUrl && (
        <Link href={`/${decision.slug}`} className="block relative">
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            <Image
              src={decision.imageUrl}
              alt={decision.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 614px"
            />
          </div>
        </Link>
      )}

      {/* Contenu simplifié */}
      <div className="px-4 py-4 space-y-3">
        <Link href={`/${decision.slug}`} className="block space-y-2">
          <h3 className="text-base font-semibold text-foreground line-clamp-2">
            {decision.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {decision.question}
          </p>
        </Link>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {typeLabels[decision.type]}
            </Badge>
            {decision.impactedDomains.slice(0, 2).map((domain) => (
              <Badge key={domain} variant="outline" className="text-xs">
                {domain}
              </Badge>
            ))}
          </div>
          <span>{timeAgo}</span>
        </div>
      </div>
    </article>
  );
}
