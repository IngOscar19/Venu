import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEventDetail } from '@/features/events/hooks/useEvents'
import { useEventMutations } from '@/features/events/hooks/useEventMutation'
import { EventStatusBadge } from '@/components/shared/EventStatusBadge'
import { normalizeEventStatus } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Ban,
  ArrowLeft,
  Clock,
  Edit,
  AlertCircle,
  Maximize2,
  ZoomIn,
} from 'lucide-react'
import { API_BASE_URL } from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { EventImageLightbox, LightboxImageItem } from '@/features/events/components/EventImageLightbox'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'
  const { data: event, isLoading, error } = useEventDetail(id)
  const { publishMutation, cancelMutation } = useEventMutations()
  const [actionError, setActionError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="text-center py-16 bg-[#161B22] rounded-2xl border border-[#30363D]">
        <p className="text-sm font-semibold text-[#F0F6FC]">Evento no encontrado</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/events')} className="mt-4">
          Volver a Mis Eventos
        </Button>
      </div>
    )
  }

  const resolveImageUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const poster = event.images?.find((img) => img.type === 'POSTER') || event.images?.[0]
  const gallery = event.images?.filter((img) => img.id !== poster?.id && img.type !== 'POSTER') || []

  // Construct ordered list of images (poster first, then gallery) for user-friendly lightbox
  const lightboxImages: LightboxImageItem[] = []
  if (poster) {
    lightboxImages.push({
      id: poster.id,
      url: resolveImageUrl(poster.url),
      type: 'POSTER',
      alt: `${event.name} - Portada`,
    })
  }
  gallery.forEach((img) => {
    lightboxImages.push({
      id: img.id,
      url: resolveImageUrl(img.url),
      type: img.type || 'GALLERY',
      alt: `${event.name} - Galería`,
    })
  })

  const normalizedStatus = normalizeEventStatus(event.status)
  const hasSections = Boolean(event.sections && event.sections.length > 0)

  const handlePublish = () => {
    setActionError(null)
    if (!hasSections) {
      setActionError(
        'El evento debe tener al menos una sección de boletos (con aforo y precio) antes de publicarse. Haz clic en "Editar Borrador" para agregarla.'
      )
      return
    }
    publishMutation.mutate(event.id, {
      onError: (err: any) => {
        setActionError(err.message || 'Error al publicar el evento.')
      },
    })
  }

  const handleCancel = () => {
    setActionError(null)
    cancelMutation.mutate(event.id, {
      onError: (err: any) => {
        setActionError(err.message || 'Error al cancelar el evento.')
      },
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-800/80 flex items-start justify-between text-xs text-rose-200 font-medium shadow-lg animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-100 text-sm">No se puede publicar el evento</p>
              <p className="mt-1 text-rose-200/90 leading-relaxed">{actionError}</p>
            </div>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-[11px] font-mono uppercase underline text-rose-400 hover:text-white px-2 py-1"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#21262D]">
        <div className="flex items-center gap-3">
          <Link to="/events">
            <Button variant="secondary" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F0F6FC] font-headline tracking-tight">
                {event.name}
              </h1>
              <EventStatusBadge status={event.status} />
            </div>
            <p className="text-xs text-[#8B949E] mt-0.5 font-mono">
              {event.eventTypeName || 'Categoría General'} • {event.organizerName || 'Organizador'}
            </p>
          </div>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2">
            {/* Botón de editar siempre disponible para borradores y eventos activos */}
            <Link to={`/events/${event.id}/edit`}>
              <Button variant="secondary" size="sm" className="gap-1.5 font-medium border border-[#30363D] hover:bg-[#21262D] text-[#F0F6FC]">
                <Edit className="w-4 h-4 text-[#FA4616]" />
                {normalizedStatus === 'DRAFT' ? 'Editar Borrador' : 'Editar Evento'}
              </Button>
            </Link>

            {normalizedStatus === 'DRAFT' && (
              <Button
                variant="default"
                size="sm"
                onClick={handlePublish}
                isLoading={publishMutation.isPending}
                className="gap-1.5 font-bold"
              >
                <CheckCircle className="w-4 h-4" />
                Publicar Evento
              </Button>
            )}

            {normalizedStatus === 'PUBLISHED' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                isLoading={cancelMutation.isPending}
                className="gap-1.5"
              >
                <Ban className="w-4 h-4" />
                Cancelar Evento
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Banner / Poster */}
      <div
        onClick={() => poster && setLightboxIndex(0)}
        className={`relative h-64 sm:h-80 rounded-3xl overflow-hidden shadow-lg border border-[#30363D] bg-[#0D1117] transition-all ${
          poster ? 'cursor-pointer group hover:border-[#FA4616]/60' : ''
        }`}
        title={poster ? 'Clic para ampliar imagen en pantalla completa' : undefined}
      >
        {poster ? (
          <>
            <img
              src={resolveImageUrl(poster.url)}
              alt={event.name}
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-95 transition-all duration-300"
            />
            {/* Visual zoom hint pill */}
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-white text-xs font-mono flex items-center gap-1.5 shadow-xl">
              <ZoomIn className="w-3.5 h-3.5 text-[#FA4616]" />
              <span>Ver en grande</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8B949E] bg-gradient-to-br from-[#161B22] to-[#21262D]">
            <Calendar className="w-12 h-12 mb-2 text-[#FA4616]" />
            <p className="text-xs font-mono">Sin imagen de portada cargada</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1117] via-[#0D1117]/30 to-transparent flex items-end p-6 sm:p-8 pointer-events-none">
          <div className="text-white space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F5A894] bg-[#161B22]/90 border border-[#30363D] px-2.5 py-1 rounded-md">
              {event.venueName}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F0F6FC] mt-1 font-headline drop-shadow-md">
              {event.name}
            </h2>
          </div>
        </div>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161B22] p-5 rounded-2xl border border-[#30363D] shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FA4616]/15 text-[#FA4616] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-[#8B949E]">Fecha</p>
            <p className="text-xs font-mono font-bold text-[#F0F6FC] mt-0.5">
              {new Date(event.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="bg-[#161B22] p-5 rounded-2xl border border-[#30363D] shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-[#8B949E]">Horario</p>
            <p className="text-xs font-mono font-bold text-[#F0F6FC] mt-0.5">
              {event.startTime.substring(0, 5)} - {event.endTime.substring(0, 5)} hrs
            </p>
          </div>
        </div>

        <div className="bg-[#161B22] p-5 rounded-2xl border border-[#30363D] shadow-sm flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/25 text-[#8DA4EF] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase text-[#8B949E]">Ubicación</p>
              <p className="text-xs font-semibold text-[#F0F6FC] mt-0.5 truncate">
                {event.city}, {event.state}
              </p>
            </div>
          </div>
          {typeof event.latitude === 'number' && typeof event.longitude === 'number' && event.latitude !== 0 && (
            <a
              href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono font-medium text-[#FA4616] hover:underline shrink-0"
              title="Abrir ubicación en Google Maps"
            >
              Maps ↗
            </a>
          )}
        </div>

        <div className="bg-[#161B22] p-5 rounded-2xl border border-[#30363D] shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-[#8B949E]">Aforo Total</p>
            <p className="text-xs font-mono font-bold text-[#F0F6FC] mt-0.5">
              {event.capacity.toLocaleString()} personas
            </p>
          </div>
        </div>
      </div>

      {/* Sections and Description */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#161B22] p-6 rounded-2xl border border-[#30363D] shadow-sm space-y-3">
            <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-[#8B949E]">
              Acerca de este evento
            </h3>
            <p className="text-xs text-[#E6EDF3] leading-relaxed whitespace-pre-line">
              {event.description || 'No se ha registrado una descripción.'}
            </p>

            <div className="pt-4 border-t border-[#21262D] space-y-1">
              <span className="text-[11px] font-mono text-[#8B949E]">Dirección del recinto:</span>
              <p className="text-xs text-[#F0F6FC]">{event.address}, {event.city}, {event.state}</p>
            </div>
          </div>

          {/* Gallery with Click-to-Zoom Lightbox */}
          {gallery.length > 0 && (
            <div className="bg-[#161B22] p-6 rounded-2xl border border-[#30363D] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-[#8B949E]">
                  Galería de Fotos
                </h3>
                <span className="text-[11px] font-mono text-[#8B949E]">
                  {gallery.length} foto{gallery.length > 1 ? 's' : ''} • Clic para ampliar
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((img, idx) => {
                  const targetIndex = poster ? idx + 1 : idx
                  return (
                    <button
                      type="button"
                      key={img.id}
                      onClick={() => setLightboxIndex(targetIndex)}
                      className="group relative rounded-xl overflow-hidden h-32 border border-[#30363D] hover:border-[#FA4616] bg-[#0D1117] transition-all text-left focus:outline-none focus:ring-2 focus:ring-[#FA4616]"
                      title="Ver foto en tamaño completo"
                    >
                      <img
                        src={resolveImageUrl(img.url)}
                        alt="Gallery"
                        className="w-full h-full object-cover group-hover:scale-110 group-hover:opacity-90 transition-all duration-300"
                      />
                      {/* Hover Overlay with Icon */}
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="p-2.5 rounded-xl bg-[#161B22]/90 text-[#FA4616] border border-[#FA4616]/40 shadow-xl scale-75 group-hover:scale-100 transition-transform duration-200">
                          <Maximize2 className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sections & Tickets List */}
        <div>
          <div className="bg-[#161B22] p-6 rounded-2xl border border-[#30363D] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-[#8B949E]">
                Secciones
              </h3>
              <span className="text-xs font-mono text-[#F5A894]">
                {event.sections?.length || 0} configuradas
              </span>
            </div>

            {event.sections && event.sections.length > 0 ? (
              <div className="divide-y divide-[#21262D] border border-[#30363D] rounded-xl overflow-hidden bg-[#0D1117]">
                {event.sections.map((sec) => (
                  <div key={sec.id} className="p-3.5 flex items-center justify-between hover:bg-[#161B22] transition-colors">
                    <div>
                      <h4 className="font-semibold text-xs text-[#F0F6FC]">{sec.name}</h4>
                      <p className="text-[11px] font-mono text-[#8B949E] mt-0.5">{sec.capacity.toLocaleString()} cupos</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-[#F5A894]">${sec.basePrice.toFixed(2)}</span>
                      <span className="block text-[10px] font-mono text-[#6E7681]">por boleto</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-dashed border-[#30363D] bg-[#0D1117] text-center space-y-3">
                <p className="text-xs text-[#8B949E]">
                  Aún no has configurado secciones ni boletos para este evento.
                </p>
                {normalizedStatus === 'DRAFT' && (
                  <Link to={`/events/${event.id}/edit`}>
                    <Button variant="secondary" size="sm" className="text-xs gap-1 border border-[#30363D] text-[#FA4616]">
                      <Edit className="w-3.5 h-3.5" />
                      Agregar Secciones y Precios
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High-Definition Interactive Lightbox Modal */}
      <EventImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(index) => setLightboxIndex(index)}
        eventName={event.name}
      />
    </div>
  )
}

export default EventDetailPage
