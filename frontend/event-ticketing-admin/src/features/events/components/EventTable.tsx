import { normalizeEventStatus, type EventDetailDto } from '@/types/api'
import { EventStatusBadge } from '@/components/shared/EventStatusBadge'
import { Button } from '@/components/ui/Button'
import { Eye, CheckCircle, Ban, Trash2, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface EventTableProps {
  events: EventDetailDto[]
  onPublish: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  isPublishing?: boolean
  isCancelling?: boolean
  isAdmin?: boolean
}

export function EventTable({
  events,
  onPublish,
  onCancel,
  onDelete,
  isAdmin: isAdminProp,
}: EventTableProps) {
  const user = useAuthStore((state) => state.user)
  const isAdmin = isAdminProp ?? (user?.role === 'ADMIN')
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#30363D] bg-[#161B22] shadow-sm">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[#21262D] bg-[#0D1117] text-[10px] font-mono font-medium text-[#8B949E] uppercase tracking-wider">
            <th className="py-3.5 pl-4 pr-3">Nombre</th>
            <th className="py-3.5 px-3">Categoría</th>
            <th className="py-3.5 px-3">Estado</th>
            <th className="py-3.5 px-3">Fecha y Hora</th>
            <th className="py-3.5 px-3">Lugar</th>
            <th className="py-3.5 px-3 text-right">Aforo</th>
            <th className="py-3.5 pl-3 pr-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#21262D]">
          {events.map((e) => {
            const status = normalizeEventStatus(e.status)
            return (
              <tr key={e.id} className="hover:bg-[#21262D]/60 transition-colors">
                <td className="py-4 pl-4 pr-3 font-semibold text-[#F0F6FC]">
                  <Link to={`/events/${e.id}`} className="hover:text-[#FA4616] transition-colors">
                    {e.name}
                  </Link>
                </td>
                <td className="py-4 px-3 text-xs text-[#8B949E]">
                  {e.eventTypeName || 'General'}
                </td>
                <td className="py-4 px-3">
                  <EventStatusBadge status={e.status} />
                </td>
                <td className="py-4 px-3 text-xs text-[#8B949E] font-mono">
                  {new Date(e.startDate).toLocaleDateString()} {e.startTime.substring(0, 5)}
                </td>
                <td className="py-4 px-3 text-xs text-[#8B949E] truncate max-w-[160px]">
                  {e.venueName}, {e.city}
                </td>
                <td className="py-4 px-3 text-right font-mono text-[#F0F6FC]">
                  {e.capacity.toLocaleString()}
                </td>
                <td className="py-4 pl-3 pr-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link to={`/events/${e.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver detalles">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>

                    {!isAdmin && status === 'DRAFT' && (
                      <Link to={`/events/${e.id}/edit`}>
                        <Button variant="secondary" size="sm" className="h-7 px-2 text-[11px] font-medium gap-1" title="Editar borrador">
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                      </Link>
                    )}

                    {!isAdmin && status === 'DRAFT' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onPublish(e.id)}
                        className="h-7 px-2 text-[11px] font-bold"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Publicar
                      </Button>
                    )}

                    {!isAdmin && status === 'PUBLISHED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onCancel(e.id)}
                        className="h-7 px-2 text-[11px] font-bold"
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    )}

                    {!isAdmin && status === 'DRAFT' && (
                      <button
                        onClick={() => onDelete(e.id)}
                        className="p-1.5 text-[#8B949E] hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
