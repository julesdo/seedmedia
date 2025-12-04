"use client"

import * as React from "react"
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

// Helper pour extraire les options des enfants React
function extractSelectOptions(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    // Vérifier si c'est un SelectItem
    const props = child.props as any
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
    // Si c'est un SelectGroup, extraire récursivement
    else if (child.props.children) {
      options.push(...extractSelectOptions(child.props.children))
    }
  })

  return options
}

interface SelectWrapperProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  size?: "sm" | "default"
  children: React.ReactNode
  forceSelect?: boolean // Pour forcer l'utilisation du Select même si > 2 options
}

/**
 * Wrapper intelligent pour Select qui bascule automatiquement vers Combobox
 * si plus de 2 options sont disponibles
 * 
 * Usage:
 * <SelectWrapper value={value} onValueChange={setValue}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Choisir..." />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="1">Option 1</SelectItem>
 *     <SelectItem value="2">Option 2</SelectItem>
 *     <SelectItem value="3">Option 3</SelectItem> {/* > 2, bascule en Combobox */}
 *   </SelectContent>
 * </SelectWrapper>
 */
export function SelectWrapper({
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  size = "default",
  children,
  forceSelect = false,
}: SelectWrapperProps) {
  // Extraire les options depuis les enfants
  // On cherche SelectContent dans les enfants
  const options = React.useMemo(() => {
    let contentChildren: React.ReactNode = null
    
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        // Si c'est SelectContent ou a des enfants (SelectContent)
        if (child.props.children) {
          contentChildren = child.props.children
        }
      }
    })

    return extractSelectOptions(contentChildren || children)
  }, [children])

  // Si plus de 2 options et pas forcé, utiliser Combobox
  if (!forceSelect && options.length > 2) {
    return (
      <Combobox
        options={options}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        size={size}
      />
    )
  }

  // Sinon, utiliser le Select normal
  return (
    <SelectPrimitive value={value} onValueChange={onValueChange} disabled={disabled}>
      {children}
    </SelectPrimitive>
  )
}

// Réexporter les composants Select
export {
  SelectGroup,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
}

