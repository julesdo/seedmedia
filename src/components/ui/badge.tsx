import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden relative",
  {
    variants: {
      variant: {
        default: "badge-glass",
        secondary: "badge-glass-secondary",
        destructive: "badge-glass-destructive",
        outline: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"
  const isGlassVariant = variant === "default" || variant === "destructive" || variant === "secondary" || !variant

  // Envelopper le texte dans un span avec le dégradé
  const renderChildren = () => {
    if (asChild || !isGlassVariant) {
      return children
    }

    // Si children est une string ou un nombre, on l'enveloppe dans un span avec la classe gradient
    if (typeof children === "string" || typeof children === "number") {
      return <span className="text-gradient-light">{children}</span>
    }

    // Fonction récursive pour traiter les enfants
    const processChild = (child: React.ReactNode, index: number): React.ReactNode => {
      // Si c'est du texte brut, on l'enveloppe dans un span avec la classe gradient
      if (typeof child === "string" && child.trim() !== "") {
        return <span key={`text-${index}`} className="text-gradient-light">{child}</span>
      }
      if (typeof child === "number") {
        return <span key={`num-${index}`} className="text-gradient-light">{child}</span>
      }
      
      // Si c'est un élément React
      if (React.isValidElement(child)) {
        // Si c'est un SVG, on applique la couleur directement
        if (child.type === "svg") {
          return React.cloneElement(child as React.ReactElement, {
            key: child.key || `svg-${index}`,
            ...child.props,
            className: cn(child.props.className),
            style: { ...child.props.style, color: "#F4F6FB" },
          })
        }
        
        // Si c'est un composant avec className qui contient SolarIcon
        if (child.props && child.props.className && typeof child.props.className === "string" && child.props.className.includes("SolarIcon")) {
          return React.cloneElement(child as React.ReactElement, {
            key: child.key || `icon-${index}`,
            ...child.props,
            className: cn(child.props.className),
            style: { ...child.props.style, color: "#F4F6FB" },
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

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {renderChildren()}
    </Comp>
  )
}

export { Badge, badgeVariants }
