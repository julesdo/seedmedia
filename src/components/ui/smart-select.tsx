"use client"

import * as React from "react"
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup as SelectGroupPrimitive,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"

interface SmartSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SmartSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  size?: "sm" | "default"
  children: React.ReactNode
}

// Helper pour extraire les options des enfants React
function extractSelectOptions(children: React.ReactNode): SmartSelectOption[] {
  const options: SmartSelectOption[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    // Vérifier si c'est un SelectItem (par le nom du composant ou la structure)
    const componentName = (child.type as any)?.displayName || (child.type as any)?.name || ""
    
    if (
      componentName === "SelectItem" ||
      (child.type as any)?.$$typeof === Symbol.for("react.forward_ref") ||
      child.props.value !== undefined
    ) {
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
    }
    // Si c'est un SelectGroup, extraire récursivement
    else if (componentName === "SelectGroup" || child.props.children) {
      options.push(...extractSelectOptions(child.props.children))
    }
  })

  return options
}

/**
 * Composant Select intelligent qui bascule automatiquement vers Combobox
 * si plus de 2 options sont disponibles
 */
export function SmartSelect({
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  size = "default",
  children,
}: SmartSelectProps) {
  // Extraire les options des enfants
  const options = React.useMemo(() => {
    return extractSelectOptions(children)
  }, [children])

  // Si plus de 2 options, utiliser Combobox
  if (options.length > 2) {
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
      <SelectTrigger className={className} size={size}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </SelectPrimitive>
  )
}

// Réexporter les composants Select pour la compatibilité
export {
  SelectGroupPrimitive as SelectGroup,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
}

