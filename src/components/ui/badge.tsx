import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Professional variants for sober, elegant look
        professional: "border-transparent bg-professional-primary text-professional-primary-foreground",
        "professional-outline": "border-professional-border text-professional-primary bg-transparent",
        success: "border-transparent bg-fighter-success text-white",
        warning: "border-transparent bg-fighter-warning text-white",
        danger: "border-transparent bg-fighter-danger text-white",
        info: "border-transparent bg-fighter-info text-white",
        // Urban Combat 2.0 variants
        neon: "border-transparent bg-purple-neon-primary text-white shadow-[0_0_10px_hsl(285_100%_68%/0.3)]",
        cyber: "border-transparent bg-purple-neon-secondary text-white shadow-[0_0_10px_hsl(220_100%_60%/0.3)]",
        glow: "border-transparent bg-purple-neon-glow text-white shadow-[0_0_10px_hsl(315_90%_70%/0.3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
