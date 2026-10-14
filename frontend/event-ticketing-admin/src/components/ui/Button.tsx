import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616] disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[#FA4616] text-white hover:bg-[#ff5c2e] shadow-md shadow-[#FA4616]/20 font-semibold',
        primary:
          'bg-[#F5A894] text-[#0D1117] hover:bg-[#ffb4a1] font-semibold',
        secondary:
          'bg-[#161B22] text-[#F0F6FC] border border-[#30363D] hover:bg-[#21262D] hover:border-[#484F58]',
        inverted:
          'bg-[#F0F6FC] text-[#0D1117] hover:bg-white font-semibold',
        outlined:
          'border border-[#F5A894]/60 text-[#F5A894] hover:bg-[#F5A894]/10 hover:border-[#F5A894]',
        tertiary:
          'bg-[#FF6B35] text-white hover:bg-[#ff8254] font-semibold',
        ghost:
          'text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC]',
        destructive:
          'bg-rose-600/90 text-white hover:bg-rose-600 border border-rose-500/40',
        link:
          'text-[#FA4616] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2 text-xs font-semibold',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-sm font-bold',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
