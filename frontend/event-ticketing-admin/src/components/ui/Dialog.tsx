import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-2xl bg-[#161B22] border border-[#30363D] p-6 text-left shadow-2xl transition-all',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#30363D]">
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#F0F6FC] tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-xs text-[#8B949E]">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
