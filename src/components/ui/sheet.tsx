"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { useEffect, useState, createContext, useContext } from "react"
import {
  Drawer as DrawerPrimitive,
  DrawerContent as DrawerContentPrimitive,
  DrawerHeader as DrawerHeaderPrimitive,
  DrawerFooter as DrawerFooterPrimitive,
  DrawerTitle as DrawerTitlePrimitive,
  DrawerDescription as DrawerDescriptionPrimitive,
  DrawerClose as DrawerClosePrimitive,
  DrawerTrigger as DrawerTriggerPrimitive,
} from "@/components/ui/drawer"

import { cn } from "@/lib/utils"

// Contexte pour partager l'information si on utilise Drawer en mobile
const SheetContext = createContext<{
  useDrawer: boolean
  side: "top" | "right" | "bottom" | "left"
}>({ useDrawer: false, side: "right" })

// Contexte pour Sheet.Root pour partager l'information avec SheetTrigger
const SheetRootContext = createContext<{
  useDrawer: boolean
}>({ useDrawer: false })

function Sheet({ 
  side,
  ...props 
}: React.ComponentProps<typeof SheetPrimitive.Root> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  const [isMobile, setIsMobile] = useState(false)
  const isBottomSheet = side === "bottom"
  const useDrawer = isBottomSheet && isMobile

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // En mobile avec side="bottom", utiliser Drawer au lieu de Sheet
  if (useDrawer) {
    return (
      <SheetRootContext.Provider value={{ useDrawer: true }}>
        <DrawerPrimitive data-slot="drawer" {...(props as any)} />
      </SheetRootContext.Provider>
    )
  }

  return (
    <SheetRootContext.Provider value={{ useDrawer: false }}>
      <SheetPrimitive.Root data-slot="sheet" {...props} />
    </SheetRootContext.Provider>
  )
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  const rootContext = useContext(SheetRootContext)
  
  if (rootContext?.useDrawer) {
    // Utiliser DrawerTrigger si on est dans un Drawer.Root
    return <DrawerTriggerPrimitive data-slot="drawer-trigger" {...(props as any)} />
  }

  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  const context = useContext(SheetContext)
  
  if (context?.useDrawer) {
    return <DrawerClosePrimitive data-slot="drawer-close" {...(props as any)} />
  }

  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  const [isMobile, setIsMobile] = useState(false)
  const isBottomSheet = side === "bottom"
  const useDrawer = isBottomSheet && isMobile

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // En mobile avec side="bottom", utiliser Drawer au lieu de Sheet
  if (useDrawer) {
    return (
      <SheetContext.Provider value={{ useDrawer: true, side }}>
        <DrawerContentPrimitive
          className={cn(className)}
          {...(props as any)}
        >
          {children}
        </DrawerContentPrimitive>
      </SheetContext.Provider>
    )
  }

  return (
    <SheetContext.Provider value={{ useDrawer: false, side }}>
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
          data-slot="sheet-content"
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
            side === "right" &&
              "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
            side === "left" &&
              "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
            side === "top" &&
              "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
            side === "bottom" &&
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
            className
          )}
          {...props}
        >
          {children}
        </SheetPrimitive.Content>
      </SheetPortal>
    </SheetContext.Provider>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  const context = useContext(SheetContext)
  
  if (context.useDrawer) {
    return <DrawerHeaderPrimitive className={cn(className)} {...props} />
  }

  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  const context = useContext(SheetContext)
  
  if (context.useDrawer) {
    return <DrawerFooterPrimitive className={cn(className)} {...props} />
  }

  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  const context = useContext(SheetContext)
  
  if (context.useDrawer) {
    return <DrawerTitlePrimitive className={cn("text-foreground font-semibold", className)} {...(props as any)} />
  }

  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  const context = useContext(SheetContext)
  
  if (context.useDrawer) {
    return <DrawerDescriptionPrimitive className={cn("text-muted-foreground text-sm", className)} {...(props as any)} />
  }

  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
