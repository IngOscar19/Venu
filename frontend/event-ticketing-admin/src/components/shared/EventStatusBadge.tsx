import { normalizeEventStatus, type EventStatus } from '@/types/api'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle2, XCircle, CalendarCheck } from 'lucide-react'

interface EventStatusBadgeProps {
  status: EventStatus
  className?: string
  showIcon?: boolean
}

const statusConfig: Record<
  'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'FINISHED',
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DRAFT: {
    label: 'BORRADOR',
    className: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
    icon: Clock,
  },
  PUBLISHED: {
    label: 'PUBLICADO',
    className: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'CANCELADO',
    className: 'bg-rose-950/40 text-rose-400 border-rose-800/60',
    icon: XCircle,
  },
  FINISHED: {
    label: 'FINALIZADO',
    className: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
    icon: CalendarCheck,
  },
}

export function EventStatusBadge({
  status,
  className,
  showIcon = true,
}: EventStatusBadgeProps) {
  const normalized = normalizeEventStatus(status)
  const config = statusConfig[normalized] || statusConfig.DRAFT
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-mono font-medium tracking-wider shadow-sm',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  )
}
