import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
        // Urban Combat 2.0 - Modern neon variants
        hero: "bg-gradient-to-r from-purple-neon-primary to-purple-neon-secondary text-white hover:scale-105 hover:shadow-[0_0_30px_hsl(285_100%_68%/0.5)] transition-all duration-300 font-bold",
        urban: "bg-transparent border-2 border-purple-neon-primary text-purple-neon-primary hover:bg-purple-neon-primary hover:text-white hover:shadow-[0_0_20px_hsl(285_100%_68%/0.4)] transition-all duration-300 font-semibold backdrop-blur-sm",
        neon: "bg-purple-neon-primary text-white hover:bg-purple-neon-glow hover:shadow-[0_0_25px_hsl(315_90%_70%/0.6)] transition-all duration-300 font-semibold",
        cyber: "bg-gradient-to-r from-purple-neon-secondary to-cyan-neon text-white hover:scale-105 hover:shadow-[0_0_30px_hsl(220_100%_60%/0.5)] transition-all duration-300 font-bold",
        vote: "bg-vote-inactive text-white hover:bg-vote-active hover:shadow-[0_0_20px_hsl(285_100%_68%/0.4)] transition-all duration-200 font-medium border border-vote-inactive hover:border-vote-active"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
