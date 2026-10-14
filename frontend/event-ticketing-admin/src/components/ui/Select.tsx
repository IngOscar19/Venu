import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  label?: string
  options?: SelectOption[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, options, placeholder, children, id, ...props }, ref) => {
    const selectId = id || React.useId()

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-mono font-medium tracking-wider text-[#8B949E] uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            defaultValue={props.value === undefined && props.defaultValue === undefined && placeholder ? '' : props.defaultValue}
            className={cn(
              'flex h-11 w-full appearance-none rounded-xl border border-[#30363D] bg-[#161B22] px-3.5 py-2 pr-9 text-sm text-[#F0F6FC] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FA4616] focus-visible:border-[#FA4616] disabled:cursor-not-allowed disabled:opacity-40',
              error && 'border-rose-500 focus-visible:ring-rose-500',
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-[#161B22] text-[#8B949E]">
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#161B22] text-[#F0F6FC]">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-[#8B949E]" />
        </div>
        {error && <p className="text-xs font-medium text-rose-400 mt-1">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
