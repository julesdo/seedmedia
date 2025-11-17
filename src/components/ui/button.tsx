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
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md",
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
  const Comp = asChild ? Slot : "button"
  const isGlassVariant = variant === "glass" || variant === "default" || !variant
  const isAccentVariant = variant === "accent"
  const isDestructiveVariant = variant === "destructive"

  // Pour les variantes glass, accent et destructive, on enveloppe le texte dans un span pour le gradient
  const renderChildren = () => {
    // Si asChild ou si ce n'est ni glass ni accent ni destructive, on ne modifie pas les children
    if (asChild || (!isGlassVariant && !isAccentVariant && !isDestructiveVariant)) {
      return children
    }

    // Déterminer la classe gradient pour le texte selon la variante
    let textGradientClass = ""
    if (isAccentVariant) {
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

    // Pour les autres cas, on utilise React.Children pour traiter tous les enfants
    const processedChildren = React.Children.map(children, (child, index) => {
      // Si c'est du texte brut, on l'enveloppe dans un span avec la classe gradient
      if (typeof child === "string") {
        return <span key={`text-${index}`} className={textGradientClass}>{child}</span>
      }
      if (typeof child === "number") {
        return <span key={`num-${index}`} className={textGradientClass}>{child}</span>
      }
      return child
    })

    return processedChildren || children
  }

  // Rendre l'icône avec les bonnes classes selon la variante
  const renderIcon = () => {
    if (!icon) return null

    // Déterminer la classe gradient selon la variante
    let gradientClass = ""
    if (isAccentVariant) {
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
