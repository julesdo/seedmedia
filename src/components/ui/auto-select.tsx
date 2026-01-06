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

    const props = child.props as any
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
    // Si c'est un SelectGroup, extraire récursivement
    else if (child.props.children) {
      options.push(...extractSelectOptions(child.props.children))
    }
  })

  return options
}

interface AutoSelectProps {
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
 * Composant Select intelligent qui bascule automatiquement vers Combobox
 * si plus de 2 options sont disponibles.
 * 
 * Utilisez ce composant à la place de Select pour avoir la détection automatique.
 * 
 * @example
 * <AutoSelect value={value} onValueChange={setValue}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Choisir..." />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="1">Option 1</SelectItem>
 *     <SelectItem value="2">Option 2</SelectItem>
 *     <SelectItem value="3">Option 3</SelectItem> // Plus de 2 options, bascule automatiquement en Combobox
 *   </SelectContent>
 * </AutoSelect>
 */
export function AutoSelect({
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  size = "default",
  children,
  forceSelect = false,
}: AutoSelectProps) {
  // Extraire les options depuis les enfants
  const options = React.useMemo(() => {
    // Chercher SelectContent dans les enfants
    let contentChildren: React.ReactNode = null
    
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        // Si c'est SelectContent ou a des enfants
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
    <SelectPrimitive value={value} onValueChange={onValueChange} disabled={disabled} forceSelect={forceSelect}>
      {children}
    </SelectPrimitive>
  )
}

// Réexporter les composants Select pour la compatibilité
export {
  SelectGroup,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
}

