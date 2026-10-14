import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default' | 'primary' | 'tertiary'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={null}>
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            variant === 'destructive'
              ? 'bg-rose-950/50 text-rose-400 border border-rose-800/40'
              : 'bg-[#FA4616]/15 text-[#F5A894] border border-[#FA4616]/30'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#F0F6FC]">{title}</h3>
          <p className="text-xs text-[#8B949E] leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[#30363D]">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={variant as any}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
          className="font-bold"
        >
          {confirmText}
        </Button>
      </div>
    </Dialog>
  )
}
