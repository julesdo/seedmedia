"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const handleValueChange = React.useCallback(
    (value: string) => {
      // Utiliser View Transitions API si disponible
      if (typeof document !== "undefined" && "startViewTransition" in document) {
        (document as any).startViewTransition(() => {
          onValueChange?.(value);
        });
      } else {
        onValueChange?.(value);
      }
    },
    [onValueChange]
  );

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      onValueChange={handleValueChange}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      // Utiliser un nom de transition commun uniquement pour le contenu actif
      // Cela permet à View Transitions de créer une transition fluide entre les différents contenus
      const isActive = contentRef.current.getAttribute("data-state") === "active";
      if (isActive) {
        contentRef.current.style.viewTransitionName = "tab-content";
      } else {
        contentRef.current.style.viewTransitionName = "none";
      }
    }
  });

  // Observer les changements d'état pour mettre à jour le view-transition-name
  React.useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const observer = new MutationObserver(() => {
      const isActive = element.getAttribute("data-state") === "active";
      if (isActive) {
        element.style.viewTransitionName = "tab-content";
      } else {
        element.style.viewTransitionName = "none";
      }
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-state"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Content
      ref={contentRef}
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none",
        "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200",
        "data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:duration-150",
        className
      )}
      value={value}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
