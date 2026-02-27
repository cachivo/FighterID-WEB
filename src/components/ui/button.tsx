import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Professional variants for sober, elegant look
        professional: "bg-professional-primary text-professional-primary-foreground hover:bg-professional-primary/90 shadow-professional",
        "professional-outline": "border border-professional-border bg-transparent text-professional-primary hover:bg-professional-primary hover:text-professional-primary-foreground",
        // Professional Urban - Matte accent variants
        hero: "bg-gradient-to-r from-purple-neon-primary to-purple-neon-secondary text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300 font-semibold",
        urban: "bg-transparent border-2 border-purple-neon-primary text-purple-neon-primary hover:bg-purple-neon-primary hover:text-white transition-all duration-300 font-medium",
        neon: "bg-purple-neon-primary text-white hover:bg-purple-neon-primary/90 shadow-sm hover:shadow-md transition-all duration-200 font-medium",
        cyber: "bg-gradient-to-r from-purple-neon-secondary to-cyan-neon text-white hover:opacity-90 shadow-sm hover:shadow-md transition-all duration-300 font-medium",
        vote: "bg-vote-inactive text-white hover:bg-vote-active transition-all duration-200 font-medium"
      },
      size: {
        default: "h-11 px-4 py-2 text-base min-h-[44px]",
        sm: "h-10 rounded-md px-3 text-sm min-h-[40px]",
        lg: "h-12 rounded-md px-8 text-lg min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
