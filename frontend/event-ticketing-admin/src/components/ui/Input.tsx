import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-mono font-medium tracking-wider text-[#8B949E] uppercase"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-11 w-full rounded-xl border border-[#30363D] bg-[#161B22] px-3.5 py-2 text-sm text-[#F0F6FC] transition-colors placeholder:text-[#6E7681] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FA4616] focus-visible:border-[#FA4616] disabled:cursor-not-allowed disabled:opacity-40',
            error && 'border-rose-500 focus-visible:ring-rose-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs font-medium text-rose-400 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#8B949E] mt-1">{helperText}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
