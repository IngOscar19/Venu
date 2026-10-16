import { Link } from 'react-router-dom'
import { normalizeEventStatus, type DashboardRecentEventDto } from '@/types/api'
import { Calendar, MapPin, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface UpcomingTimelineProps {
  events?: DashboardRecentEventDto[]
}

export function UpcomingTimeline({ events = [] }: UpcomingTimelineProps) {
  // Sort upcoming events by date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  ).slice(0, 4)

  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        return { day: '--', month: '---', time: '--:--' }
      }
      const day = date.getDate().toString().padStart(2, '0')
      const month = date.toLocaleDateString('es-MX', { month: 'short' }).toUpperCase().replace('.', '')
      const time = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
      return { day, month, time }
    } catch {
      return { day: '--', month: '---', time: '--:--' }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2ECC71] bg-[#2ECC71]/10 px-2 py-0.5 rounded-md border border-[#2ECC71]/30">
            <CheckCircle2 className="h-3 w-3" /> Publicado
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#E74C3C] bg-[#E74C3C]/10 px-2 py-0.5 rounded-md border border-[#E74C3C]/30">
            <XCircle className="h-3 w-3" /> Cancelado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5 rounded-md border border-[#FF6B35]/30">
            <Clock className="h-3 w-3" /> Borrador
          </span>
        )
    }
  }

  return (
    <div className="rounded-3xl bg-[#1A1D24] border border-[#30363D] p-6 shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#21262D]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#2ECC71]">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F0F6FC] font-headline">
                Línea de Tiempo de Eventos
              </h3>
              <p className="text-xs text-[#8B949E]">
                Próximas fechas y actividad en agenda
              </p>
            </div>
          </div>
          <Link
            to="/events"
            className="text-xs font-mono font-medium text-[#FF6B35] hover:text-[#FF5A1F] hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-[#21262D] flex items-center justify-center text-[#8B949E] mb-3">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-[#F0F6FC]">No hay eventos en la agenda</p>
            <p className="text-xs text-[#8B949E] mt-1 max-w-xs">
              Cuando crees eventos con fechas programadas, aparecerán aquí ordenados cronológicamente.
            </p>
            <Link
              to="/events/new"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A1F] hover:underline"
            >
              Programar un evento &rarr;
            </Link>
          </div>
        ) : (
          <div className="relative mt-5 space-y-4 before:absolute before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#21262D] before:pointer-events-none">
            {sortedEvents.map((event) => {
              const { day, month, time } = formatEventDate(event.startDate)
              return (
                <div
                  key={event.id}
                  className="relative flex items-start gap-3.5 pl-1 group"
                >
                  {/* Badge de Fecha tipo calendario */}
                  <div className="relative z-10 flex flex-col items-center justify-center w-11 h-12 rounded-xl bg-[#0D0F14] border border-[#30363D] shrink-0 text-center shadow-sm group-hover:border-[#FF5A1F] transition-colors pointer-events-none select-none">
                    <span className="text-[10px] font-mono font-bold text-[#FF5A1F] leading-none">
                      {month}
                    </span>
                    <span className="text-sm font-black text-[#F0F6FC] font-headline leading-tight mt-0.5">
                      {day}
                    </span>
                  </div>

                  {/* Detalle del evento */}
                  <div className="flex-1 min-w-0 bg-[#21262D]/40 hover:bg-[#21262D]/70 transition-all rounded-xl p-3 border border-[#30363D]/40">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/events/${event.id}`}
                        className="text-xs sm:text-sm font-bold text-[#F0F6FC] hover:text-[#FF5A1F] truncate transition-colors"
                      >
                        {event.name}
                      </Link>
                      {getStatusBadge(normalizeEventStatus(event.status))}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11px] text-[#8B949E] flex-wrap">
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <MapPin className="h-3 w-3 text-[#FF5A1F] shrink-0" />
                        <span className="truncate">{event.venueName || 'Recinto por confirmar'}</span>
                      </span>
                      <span>·</span>
                      <span>{time !== '--:--' ? `${time} hrs` : 'Horario a confirmar'}</span>
                      <span>·</span>
                      <span className="font-mono text-[#F0F6FC]">
                        {event.ticketsSold} / {event.capacity} boletos
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#21262D] text-center">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
        >
          Explorar calendario completo
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
