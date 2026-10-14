import type { DashboardRecentEventDto } from '@/types/api'
import { EventStatusBadge } from '@/components/shared/EventStatusBadge'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface RecentEventsTableProps {
  events?: DashboardRecentEventDto[]
}

export function RecentEventsTable({ events }: RecentEventsTableProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-10 h-10 mx-auto text-[#6E7681] mb-3" />
        <h3 className="text-sm font-semibold text-[#F0F6FC]">No hay eventos registrados</h3>
        <p className="text-xs text-[#8B949E] mt-1 max-w-sm mx-auto">
          Comienza creando y publicando tu primer evento en la plataforma.
        </p>
        <div className="mt-4">
          <Link to="/events/new">
            <Button variant="default" size="sm">
              Crear mi primer evento
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[#21262D] text-[11px] font-mono font-medium text-[#8B949E] uppercase tracking-wider">
            <th className="pb-3 pl-2">Evento</th>
            <th className="pb-3">Estado</th>
            <th className="pb-3">Fecha</th>
            <th className="pb-3">Recinto</th>
            <th className="pb-3 text-right">Boletos</th>
            <th className="pb-3 text-right pr-2">Recaudación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#21262D]">
          {events.map((e) => (
            <tr key={e.id} className="hover:bg-[#21262D]/60 transition-colors">
              <td className="py-3.5 pl-2 font-semibold text-[#F0F6FC]">
                <Link to={`/events/${e.id}`} className="hover:text-[#FA4616] transition-colors">
                  {e.name}
                </Link>
              </td>
              <td className="py-3.5">
                <EventStatusBadge status={e.status} />
              </td>
              <td className="py-3.5 text-[#8B949E] font-mono">
                {new Date(e.startDate).toLocaleDateString()}
              </td>
              <td className="py-3.5 text-[#8B949E]">{e.venueName}</td>
              <td className="py-3.5 text-right font-mono text-[#F0F6FC]">
                {e.ticketsSold} / {e.capacity}
              </td>
              <td className="py-3.5 text-right pr-2 font-mono font-bold text-[#F5A894]">
                ${e.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
