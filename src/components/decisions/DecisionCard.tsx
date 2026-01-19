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
import { BoostButton } from "./BoostButton";
import { useTranslations } from 'next-intl';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    impactLevel: 1 | 2 | 3 | 4 | 5; // ✅ Échelle d'impact décisionnel (remplace emoji)
    badgeColor: string;
  };
  className?: string;
  isSaved?: boolean; // Passé depuis DecisionList pour éviter les requêtes multiples
}

const statusColors: Record<DecisionCardProps["decision"]["status"], string> = {
  announced: "text-blue-600 dark:text-blue-400",
  tracking: "text-orange-600 dark:text-orange-400",
  resolved: "text-green-600 dark:text-green-400",
};

export function DecisionCard({
  decision,
  className,
  isSaved: isSavedProp,
}: DecisionCardProps) {
  const t = useTranslations('decisions');
  const router = useRouter();
  const decisionDate = new Date(decision.date);
  const timeAgo = formatDistanceToNow(decisionDate, { addSuffix: true });
  const [isMobile, setIsMobile] = useState(false);
  
  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Prefetch intelligent : desktop au survol, mobile au clic
  const handlePrefetch = () => {
    router.prefetch(`/${decision.slug}`);
  };

  // Navigation optimiste avec startTransition
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Précharger si pas déjà fait
    router.prefetch(`/${decision.slug}`);
    
    // Laisser Next.js gérer la navigation (déjà optimisée)
    // Pas besoin de preventDefault, Next.js gère déjà
  };

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
      {/* Header simplifié - 2 lignes sur mobile */}
      <div className={cn(
        "px-4 py-3 border-b border-border/50",
        isMobile ? "space-y-2" : "flex items-center justify-between"
      )}>
        {/* Ligne 1 : Infos principales */}
        <Link 
          href={`/${decision.slug}`} 
          className={cn(
            "flex items-center",
            isMobile ? "w-full" : "flex-1 min-w-0"
          )}
          prefetch={false}
          onMouseEnter={!isMobile ? handlePrefetch : undefined}
          onClick={isMobile ? handlePrefetch : undefined}
        >
          <span className={cn(
            "text-sm text-muted-foreground",
            isMobile ? "truncate flex-1 min-w-0" : "truncate"
          )}>
            {decision.decider}
          </span>
        </Link>
        
        {/* Ligne 2 sur mobile, même ligne sur desktop */}
        <div className={cn(
          "flex items-center",
          isMobile ? "justify-between w-full" : "gap-2"
        )}>
          {/* 🎯 FEATURE 4: LE MÉGAPHONE - Bouton booster */}
          <BoostButton decisionId={decision._id} />
          
          {/* Bouton enregistré - toujours à droite */}
          <div className={isMobile ? "ml-auto" : ""}>
            <SaveButton decisionId={decision._id} size="icon" isSaved={isSavedProp} />
          </div>
        </div>
      </div>

      {/* Image pleine largeur - Style Instagram */}
      {decision.imageUrl && (
        <Link 
          href={`/${decision.slug}`} 
          className="block relative"
          prefetch={false}
          onMouseEnter={!isMobile ? handlePrefetch : undefined}
          onClick={isMobile ? handlePrefetch : undefined}
        >
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
        <Link 
          href={`/${decision.slug}`} 
          className="block space-y-2"
          prefetch={true}
          data-prefetch="viewport"
          onMouseEnter={!isMobile ? handlePrefetch : undefined}
          onClick={handleClick}
        >
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
