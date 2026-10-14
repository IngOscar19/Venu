import { normalizeEventStatus, type EventDetailDto } from '@/types/api'
import { EventStatusBadge } from '@/components/shared/EventStatusBadge'
import { Button } from '@/components/ui/Button'
import { Calendar, MapPin, Users, Eye, CheckCircle, Ban, Trash2, Edit } from 'lucide-react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

interface EventCardProps {
  event: EventDetailDto
  onPublish: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  isPublishing?: boolean
  isCancelling?: boolean
  isDeleting?: boolean
  isAdmin?: boolean
}

export function EventCard({
  event,
  onPublish,
  onCancel,
  onDelete,
  isPublishing = false,
  isCancelling = false,
  isAdmin: isAdminProp,
}: EventCardProps) {
  const user = useAuthStore((state) => state.user)
  const isAdmin = isAdminProp ?? (user?.role === 'ADMIN')
  const normalizedStatus = normalizeEventStatus(event.status)
  const resolveImageUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const poster = event.images?.find((img) => img.type === 'POSTER') || event.images?.[0]

  return (
    <div className="bg-[#161B22] rounded-2xl overflow-hidden border border-[#30363D] shadow-sm hover:border-[#484F58] transition-all flex flex-col group">
      {/* Poster */}
      <div className="relative h-44 bg-[#0D1117] overflow-hidden">
        {poster ? (
          <img
            src={resolveImageUrl(poster.url)}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center event-poster-placeholder">
            <Calendar className="w-8 h-8 mb-1 text-[#FA4616]" />
            <span className="text-[11px] font-mono font-medium">Sin portada</span>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <EventStatusBadge status={event.status} />
        </div>

        {event.eventTypeName && (
          <div className="absolute top-3 left-3 event-badge-overlay text-[10px] font-mono px-2.5 py-0.5 rounded-md shadow-sm">
            {event.eventTypeName}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#F0F6FC] line-clamp-1 group-hover:text-[#FA4616] transition-colors font-headline">
            {event.name}
          </h3>
          <p className="text-xs text-[#8B949E] mt-1 line-clamp-2 leading-relaxed">
            {event.description || 'Sin descripción registrada.'}
          </p>

          <div className="mt-4 space-y-2 text-xs text-[#8B949E]">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#6E7681] shrink-0" />
              <span className="font-mono text-[11px]">
                {new Date(event.startDate).toLocaleDateString()} • {event.startTime.substring(0, 5)} hrs
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#6E7681] shrink-0" />
              <span className="truncate text-[11px]">{event.venueName}, {event.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#6E7681] shrink-0" />
              <span className="font-mono text-[11px]">Aforo: {event.capacity.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 pt-4 border-t border-[#21262D] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Link to={`/events/${event.id}`}>
              <Button variant="secondary" size="sm" className="gap-1 text-xs">
                <Eye className="w-3.5 h-3.5" />
                Detalles
              </Button>
            </Link>

            {!isAdmin && normalizedStatus === 'DRAFT' && (
              <Link to={`/events/${event.id}/edit`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs border border-[#30363D] hover:bg-[#21262D] text-[#F0F6FC]">
                  <Edit className="w-3.5 h-3.5 text-[#FA4616]" />
                  Editar
                </Button>
              </Link>
            )}
          </div>

          {!isAdmin && (
            <div className="flex items-center gap-1.5">
              {normalizedStatus === 'DRAFT' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onPublish(event.id)}
                  isLoading={isPublishing}
                  className="gap-1 text-xs font-bold"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Publicar
                </Button>
              )}

              {normalizedStatus === 'PUBLISHED' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onCancel(event.id)}
                  isLoading={isCancelling}
                  className="gap-1 text-xs"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Cancelar
                </Button>
              )}

              {normalizedStatus === 'DRAFT' && (
                <button
                  onClick={() => onDelete(event.id)}
                  title="Eliminar evento"
                  className="p-1.5 rounded-lg text-[#8B949E] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
