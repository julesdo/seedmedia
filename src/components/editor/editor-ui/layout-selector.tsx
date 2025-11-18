"use client";

import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { BlockLayout } from "@/components/blocks/editor-00/nodes/chart-node";
import { cn } from "@/lib/utils";

interface LayoutSelectorProps {
  layout: BlockLayout;
  onLayoutChange: (layout: BlockLayout) => void;
  className?: string;
}

export function LayoutSelector({ layout, onLayoutChange, className }: LayoutSelectorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground/70">Layout:</span>
      <div className="flex gap-1">
        <Button
          type="button"
          variant={layout === "full" ? "glass" : "outline"}
          size="sm"
          onClick={() => onLayoutChange("full")}
          className={cn(
            "h-7 px-2 text-xs",
            layout === "full" && "bg-primary/20 text-primary ring-1 ring-primary/30"
          )}
          title="Pleine largeur (1/1)"
        >
          <SolarIcon icon="square-bold" className="h-3 w-3" />
          <span className="ml-1">1/1</span>
        </Button>
        <Button
          type="button"
          variant={layout === "half" ? "glass" : "outline"}
          size="sm"
          onClick={() => onLayoutChange("half")}
          className={cn(
            "h-7 px-2 text-xs",
            layout === "half" && "bg-primary/20 text-primary ring-1 ring-primary/30"
          )}
          title="Moitié (1/2)"
        >
          <SolarIcon icon="widget-4-bold" className="h-3 w-3" />
          <span className="ml-1">1/2</span>
        </Button>
      </div>
    </div>
  );
}

