"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Combobox } from "@/components/ui/combobox"

const SelectRoot = SelectPrimitive.Root

// Helper pour extraire les options des enfants React
function extractSelectOptions(children: React.ReactNode): Array<{ value: string; label: string; disabled?: boolean }> {
  const options: Array<{ value: string; label: string; disabled?: boolean }> = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    const props = child.props as any
    
    // Si c'est SelectContent, extraire ses enfants récursivement
    if (child.props.children) {
      const contentOptions = extractSelectOptions(child.props.children)
      options.push(...contentOptions)
    }
    
    // Si c'est un SelectItem (a une prop value)
    if (props.value !== undefined) {
      const label = typeof props.children === "string" 
        ? props.children 
        : React.Children.toArray(props.children).find(
            (c) => typeof c === "string"
          ) || props.value || ""
      
      options.push({
        value: props.value,
        label: String(label),
        disabled: props.disabled || false,
      })
    }
  })

  return options
}

// Helper pour extraire le placeholder depuis SelectValue
function extractPlaceholder(children: React.ReactNode): string | undefined {
  let placeholder: string | undefined

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    const props = child.props as any
    
    // Si c'est SelectValue, extraire le placeholder
    if (props.placeholder !== undefined) {
      placeholder = props.placeholder
    }
    
    // Sinon, chercher récursivement
    if (child.props.children) {
      const found = extractPlaceholder(child.props.children)
      if (found) placeholder = found
    }
  })

  return placeholder
}

// Helper pour extraire la taille et className depuis SelectTrigger
function extractTriggerProps(children: React.ReactNode): { size?: "sm" | "default"; className?: string } {
  let size: "sm" | "default" | undefined
  let className: string | undefined

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    const props = child.props as any
    
    // Si c'est SelectTrigger, extraire size et className
    if (props.size !== undefined || props.className !== undefined) {
      if (props.size !== undefined) size = props.size
      if (props.className !== undefined) className = props.className
    }
    
    // Sinon, chercher récursivement
    if (child.props.children) {
      const found = extractTriggerProps(child.props.children)
      if (found.size) size = found.size
      if (found.className) className = found.className
    }
  })

  return { size, className }
}

interface SelectProps extends React.ComponentProps<typeof SelectPrimitive.Root> {
  // Prop optionnel pour forcer l'utilisation du Select même si > 2 options
  forceSelect?: boolean
  children: React.ReactNode
}

function Select({
  forceSelect = false,
  children,
  ...props
}: SelectProps) {
  // Extraire les options depuis les enfants
  const options = React.useMemo(() => {
    return extractSelectOptions(children)
  }, [children])

  // Extraire le placeholder depuis SelectValue
  const placeholder = React.useMemo(() => {
    return extractPlaceholder(children) || (props.placeholder as string)
  }, [children, props.placeholder])

  // Extraire la taille et className depuis SelectTrigger
  const triggerProps = React.useMemo(() => {
    return extractTriggerProps(children)
  }, [children])

  // Si plus de 2 options et pas forcé, utiliser Combobox
  if (!forceSelect && options.length > 2) {
    return (
      <Combobox
        options={options}
        value={props.value}
        onValueChange={props.onValueChange}
        placeholder={placeholder}
        disabled={props.disabled}
        size={triggerProps.size || "default"}
        className={triggerProps.className}
      />
    )
  }

  return <SelectRoot data-slot="select" {...props}>{children}</SelectRoot>
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "select-trigger-accent border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

// Helper pour compter les SelectItem dans les enfants
function countSelectItems(children: React.ReactNode): number {
  let count = 0
  
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    
    const props = child.props as any
    // Si c'est un SelectItem (a une prop value)
    if (props.value !== undefined) {
      count++
    }
    // Si c'est un SelectGroup, compter récursivement
    else if (child.props.children) {
      count += countSelectItems(child.props.children)
    }
  })
  
  return count
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  // Compter le nombre d'items
  const itemCount = React.useMemo(() => countSelectItems(children), [children])
  
  // Si plus de 2 items, ajouter une classe pour indiquer qu'on devrait utiliser Combobox
  // (on ne peut pas changer le composant ici car SelectContent est déjà rendu)
  // Cette logique sera gérée au niveau du composant parent SelectWrapper
  
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-item-count={itemCount}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "select-item-accent focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
