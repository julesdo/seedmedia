"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

/**
 * Stories horizontales pour les décisions importantes (style Instagram)
 */
export function DecisionStories() {
  // ✅ Protection : skip si Convex n'est pas disponible
  const hotDecisions = useQuery(api.decisions.getHotDecisions, { limit: 8 }) || undefined;

  if (!hotDecisions || hotDecisions.length === 0) {
    return null;
  }

  return (
    <div className="w-full border-b border-border/50 bg-background py-4 md:py-6">
      <Carousel
        opts={{
          align: "start",
          loop: false,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {hotDecisions.map((decision) => (
            <CarouselItem key={decision._id} className="pl-2 md:pl-4 basis-auto">
              <Link
                href={`/${decision.slug}`}
                prefetch={true}
                data-prefetch="viewport"
                className="group flex flex-col items-center gap-2 w-20 md:w-24"
              >
                {/* Cercle avec image (comme Instagram Stories) */}
                <div className="relative">
                  {/* Cercle extérieur avec gradient (comme Instagram) */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full p-0.5",
                      "bg-gradient-to-tr from-primary via-primary/80 to-primary/60",
                      "group-hover:scale-110 transition-transform duration-300"
                    )}
                  >
                    <div className="w-full h-full rounded-full bg-background" />
                  </div>
                  
                  {/* Image à l'intérieur */}
                  <div className="relative size-20 md:size-24 rounded-full overflow-hidden bg-muted ring-2 ring-background">
                    {decision.imageUrl ? (
                      <Image
                        src={decision.imageUrl}
                        alt={decision.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/20 to-primary/5">
                        <SolarIcon
                          icon="document-text-bold"
                          className="size-8 md:size-10 text-primary/60"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Titre tronqué (comme Instagram) */}
                <p className="text-xs font-medium text-foreground text-center line-clamp-2 max-w-[80px] md:max-w-[96px] group-hover:text-primary transition-colors">
                  {decision.title.length > 30
                    ? `${decision.title.substring(0, 30)}...`
                    : decision.title}
                </p>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

