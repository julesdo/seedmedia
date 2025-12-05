import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { SolarIcon } from "@/components/icons/SolarIcon"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "button-glass",
        glass: "button-glass",
        accent: "button-accent",
        destructive: "button-destructive",
        outline:
          "button-outline border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md",
        ghost:
          "button-ghost rounded-md",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "glass",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  icon,
  iconPosition = "left",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    icon?: string
    iconPosition?: "left" | "right"
  }) {
  const isGlassVariant = variant === "glass" || variant === "default" || !variant
  const isAccentVariant = variant === "accent"
  const isDestructiveVariant = variant === "destructive"
  const isGhostVariant = variant === "ghost"

  // Pour les variantes glass, accent, destructive et ghost (au hover), on enveloppe le texte dans un span pour le gradient
  const renderChildren = () => {
    // Si asChild ou si ce n'est ni glass ni accent ni destructive ni ghost, on ne modifie pas les children
    if (asChild || (!isGlassVariant && !isAccentVariant && !isDestructiveVariant && !isGhostVariant)) {
      return children
    }

    // Déterminer la classe gradient pour le texte selon la variante
    // Pour ghost, on applique text-gradient-accent seulement au hover (via CSS), pas par défaut
    let textGradientClass = ""
    if (isAccentVariant) {
      textGradientClass = "text-gradient-accent"
    } else if (isGhostVariant) {
      // Ghost n'utilise pas de gradient par défaut, seulement au hover
      textGradientClass = "text-gradient-accent"
    } else if (isDestructiveVariant) {
      textGradientClass = "text-gradient-destructive"
    } else if (isGlassVariant) {
      textGradientClass = "text-gradient-light"
    }

    // Si children est une string ou un nombre, on l'enveloppe dans un span avec la classe gradient
    if (typeof children === "string" || typeof children === "number") {
      return <span className={textGradientClass}>{children}</span>
    }

    // Fonction récursive pour traiter les enfants
    const processChild = (child: React.ReactNode, index: number): React.ReactNode => {
      // Si c'est du texte brut, on l'enveloppe dans un span avec la classe gradient
      if (typeof child === "string" && child.trim() !== "") {
        return <span key={`text-${index}`} className={textGradientClass}>{child}</span>
      }
      if (typeof child === "number") {
        return <span key={`num-${index}`} className={textGradientClass}>{child}</span>
      }
      
      // Si c'est un élément React
      if (React.isValidElement(child)) {
        // Si c'est un SVG, on applique la couleur directement
        if (child.type === "svg") {
          return React.cloneElement(child as React.ReactElement, {
            key: child.key || `svg-${index}`,
            ...child.props,
            className: cn(child.props.className),
            style: { 
              ...child.props.style, 
              color: isAccentVariant ? "#FFFFFF" : isDestructiveVariant ? "#FFFFFF" : "#F4F6FB" 
            },
          })
        }

        // Si c'est un composant avec className qui contient SolarIcon
        if (
          React.isValidElement(child) &&
          typeof (child.props as { className?: unknown }).className === "string" &&
          (child.props as { className: string }).className.includes("SolarIcon")
        ) {
          return React.cloneElement(child as React.ReactElement<any, any>, {
            key: child.key || `icon-${index}`,
            ...(child.props as Record<string, any>),
            className: cn((child.props as { className: string }).className),
            style: { 
              ...child.props.style, 
              color: isAccentVariant ? "#FFFFFF" : isDestructiveVariant ? "#FFFFFF" : "#F4F6FB" 
            },
          })
        }
        
        // Si l'élément a des enfants, on les traite récursivement
        if (child.props && child.props.children) {
          const processedChildren = React.Children.map(child.props.children, (grandChild, grandIndex) => {
            return processChild(grandChild, grandIndex)
          })
          
          return React.cloneElement(child as React.ReactElement, {
            key: child.key || `element-${index}`,
            ...child.props,
            children: processedChildren,
          })
        }
      }
      
      return child
    }

    // Traiter tous les enfants
    const processedChildren = React.Children.map(children, (child, index) => {
      return processChild(child, index)
    })

    return processedChildren || children
  }

    // Rendre l'icône avec les bonnes classes selon la variante
  const renderIcon = () => {
    if (!icon) return null

    // Déterminer la classe gradient selon la variante
    // Pour ghost, on applique icon-gradient-accent seulement au hover (via CSS), pas par défaut
    let gradientClass = ""
    if (isAccentVariant) {
      gradientClass = "icon-gradient-accent"
    } else if (isGhostVariant) {
      // Ghost n'utilise pas de gradient par défaut, seulement au hover
      gradientClass = "icon-gradient-accent"
    } else if (isDestructiveVariant) {
      gradientClass = "icon-gradient-destructive"
    } else if (isGlassVariant) {
      gradientClass = "icon-gradient-light"
    }

    const iconClasses = cn(
      "h-4 w-4 flex-shrink-0",
      gradientClass // Classe gradient pour les icônes
    )

    return (
      <span className="button-icon-wrapper">
        <SolarIcon 
          icon={icon} 
          className={iconClasses}
        />
      </span>
    )
  }

  const content = (
    <>
      {icon && iconPosition === "left" && renderIcon()}
      {renderChildren()}
      {icon && iconPosition === "right" && renderIcon()}
    </>
  )

  const buttonClassName = cn(buttonVariants({ variant, size, className }))

  if (asChild) {
    // Si asChild est true et qu'on a une icône, on ne peut pas utiliser asChild
    // car on crée un Fragment avec content (icône + texte + icône)
    // Dans ce cas, on retourne un bouton normal sans asChild
    if (icon) {
      return (
        <button
          className={buttonClassName}
          {...props}
        >
          {content}
        </button>
      )
    }
    
    // Si pas d'icône, on peut utiliser asChild normalement
    // On passe directement children au Slot qui fusionnera les props
    return (
      <Slot 
        className={buttonClassName}
        {...props}
      >
        {children}
      </Slot>
    )
  }

  const Comp = asChild ? Slot : "button"
  
  return (
    <Comp
      data-slot="button"
      className={buttonClassName}
      {...props}
    >
      {content}
    </Comp>
  )
}

export { Button, buttonVariants }
