import { Link } from 'react-router-dom'
import { normalizeEventStatus, type DashboardRecentEventDto } from '@/types/api'
import { Calendar, MapPin, Ticket, ArrowRight, Clock, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react'

interface RecentEventsCardsListProps {
  events?: DashboardRecentEventDto[]
  searchFilter?: string
}

export function RecentEventsCardsList({
  events = [],
  searchFilter = '',
}: RecentEventsCardsListProps) {
  // Filter events if search query is passed
  const filteredEvents = events.filter((e) => {
    if (!searchFilter.trim()) return true
    const q = searchFilter.toLowerCase()
    return (
      e.name.toLowerCase().includes(q) ||
      (e.venueName && e.venueName.toLowerCase().includes(q))
    )
  })

  // Format date in readable human Spanish: "9 oct 2026"
  const formatDateHuman = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Get status metadata
  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return {
          label: 'PUBLICADO',
          color: 'text-[#2ECC71]',
          bg: 'bg-[#2ECC71]/10',
          border: 'border-[#2ECC71]/30',
          leftBorder: 'border-l-[#2ECC71]',
          barColor: 'bg-[#2ECC71]',
          dotColor: 'bg-[#2ECC71]',
          icon: CheckCircle2,
        }
      case 'CANCELLED':
        return {
          label: 'CANCELADO',
          color: 'text-[#E74C3C]',
          bg: 'bg-[#E74C3C]/10',
          border: 'border-[#E74C3C]/30',
          leftBorder: 'border-l-[#E74C3C]',
          barColor: 'bg-[#E74C3C]',
          dotColor: 'bg-[#E74C3C]',
          icon: XCircle,
        }
      default:
        return {
          label: 'BORRADOR',
          color: 'text-[#FF6B35]',
          bg: 'bg-[#FF6B35]/10',
          border: 'border-[#FF6B35]/30',
          leftBorder: 'border-l-[#FF6B35]',
          barColor: 'bg-[#FF6B35]',
          dotColor: 'bg-[#FF6B35]',
          icon: Clock,
        }
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-[#1A1D24] border border-[#30363D]">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#FF5A1F] mb-4">
          <Calendar className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#F0F6FC] font-headline">
          No hay eventos registrados todavía
        </h3>
        <p className="text-sm text-[#8B949E] mt-1 max-w-md mx-auto leading-relaxed">
          Comienza creando y publicando tu primer evento para que aparezca aquí con métricas y avance visual en tiempo real.
        </p>
        <div className="mt-5">
          <Link
            to="/events/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-[#FF5A1F] hover:bg-[#FF6B35] transition-colors shadow-lg"
          >
            Crear mi primer evento
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  if (filteredEvents.length === 0 && searchFilter.trim()) {
    return (
      <div className="text-center py-10 px-4 rounded-2xl bg-[#1A1D24] border border-[#30363D]">
        <p className="text-sm text-[#8B949E]">
          No se encontraron eventos que coincidan con "<strong className="text-[#F0F6FC]">{searchFilter}</strong>".
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredEvents.map((event) => {
        const normalized = normalizeEventStatus(event.status)
        const meta = getStatusMeta(normalized)
        const StatusIcon = meta.icon
        const soldPercentage =
          event.capacity > 0
            ? Math.round((event.ticketsSold / event.capacity) * 100)
            : 0

        return (
          <div
            key={event.id}
            className={`group rounded-2xl bg-[#1A1D24] border border-[#30363D] ${meta.leftBorder} border-l-[6px] p-5 sm:p-6 shadow-sm hover:border-[#484F58] hover:shadow-md transition-all relative overflow-hidden`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Información principal del evento */}
              <div className="space-y-2 flex-1 min-w-0">
                {/* Fila superior: Estado + Ubicación + Fecha legible */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#8B949E]">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wider ${meta.bg} ${meta.color} border ${meta.border}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {meta.label}
                  </span>

                  <span className="text-[#30363D]">|</span>

                  <span className="flex items-center gap-1 text-[#F0F6FC] font-medium">
                    <MapPin className="h-3.5 w-3.5 text-[#FF5A1F]" />
                    <span className="truncate max-w-[220px]">{event.venueName || 'Recinto por definir'}</span>
                  </span>

                  <span className="text-[#30363D]">·</span>

                  <span className="font-mono text-[#8B949E]">
                    {formatDateHuman(event.startDate)}
                  </span>
                </div>

                {/* Título del evento con hover */}
                <div>
                  <Link
                    to={`/events/${event.id}`}
                    className="inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-[#F0F6FC] group-hover:text-[#FF5A1F] transition-colors font-headline"
                  >
                    {event.name}
                    <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#FF5A1F]" />
                  </Link>
                </div>
              </div>

              {/* Métricas visuales: Boletos con barra + Recaudación destacada */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 lg:gap-8 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#21262D]">
                {/* Barra de boletos vendidos */}
                <div className="w-full sm:w-56 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8B949E] flex items-center gap-1 font-mono">
                      <Ticket className="h-3.5 w-3.5 text-[#FF6B35]" />
                      {event.ticketsSold.toLocaleString()} / {event.capacity.toLocaleString()} boletos
                    </span>
                    <span className="font-mono font-bold text-[#F0F6FC] text-[11px]">
                      {soldPercentage}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#0D0F14] overflow-hidden border border-[#30363D]/60 p-0.5">
                    <div
                      className={`h-full rounded-full ${meta.barColor} transition-all duration-500`}
                      style={{ width: `${Math.max(soldPercentage, event.capacity > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>

                {/* Recaudación destacada */}
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">
                    Recaudación
                  </p>
                  <p className="text-base sm:text-lg font-black text-[#F0F6FC] font-mono mt-0.5">
                    <span className="text-[#2ECC71] mr-1">💵</span>
                    ${event.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    <span className="text-xs text-[#8B949E] font-normal ml-1">MXN</span>
                  </p>
                </div>

                {/* Botón de acción hacia el detalle */}
                <div className="shrink-0 flex items-center justify-end">
                  <Link
                    to={`/events/${event.id}`}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#21262D] hover:bg-[#FF5A1F] hover:text-white text-[#8B949E] transition-all text-xs font-semibold flex items-center gap-1.5 border border-[#30363D]"
                    title="Ver detalles del evento"
                  >
                    <span className="hidden sm:inline">Detalles</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Botón grande y claro: "Ver catálogo completo →" con acento naranja */}
      <div className="pt-3">
        <Link
          to="/events"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1A1D24] border-2 border-[#FF5A1F]/40 hover:border-[#FF5A1F] hover:bg-[#FF5A1F]/10 py-4 px-6 text-sm sm:text-base font-bold text-[#F0F6FC] hover:text-[#FF5A1F] transition-all shadow-md group"
        >
          <span>Ver catálogo completo</span>
          <ArrowRight className="h-4 w-4 text-[#FF5A1F] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
