import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-mono font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-[#30363D] bg-[#21262D] text-[#F0F6FC]',
        primary:
          'border-[#FA4616]/40 bg-[#FA4616]/15 text-[#F5A894]',
        secondary:
          'border-[#003087]/50 bg-[#003087]/20 text-[#8DA4EF]',
        tertiary:
          'border-[#FF6B35]/40 bg-[#FF6B35]/15 text-[#FFA07A]',
        destructive:
          'border-rose-800/60 bg-rose-950/40 text-rose-400',
        success:
          'border-emerald-800/60 bg-emerald-950/40 text-emerald-400',
        outline:
          'border-[#30363D] text-[#8B949E]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
