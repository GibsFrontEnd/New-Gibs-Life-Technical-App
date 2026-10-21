import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/class-names"

const badgeVariants = cva(
  "inline-flex max-w-full items-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-0.5 align-middle text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-blue-200 bg-blue-50 text-blue-700",
        secondary:
          "border-slate-200 bg-slate-50 text-slate-600",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700",
        outline: "border-slate-200 bg-white text-slate-700",
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
