import { useState } from 'react'
import { useMyEvents } from '@/features/events/hooks/useEvents'
import { useEventMutations } from '@/features/events/hooks/useEventMutation'
import { PageHeader } from '@/components/shared/PageHeader'
import { EventCard } from '@/features/events/components/EventCard'
import { EventTable } from '@/features/events/components/EventTable'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Link } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, AlertCircle } from 'lucide-react'
import { normalizeEventStatus } from '@/types/api'

import { useAuthStore } from '@/store/authStore'

export function EventListPage() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)

  const { data: events, isLoading } = useMyEvents()
  const { publishMutation, cancelMutation, deleteMutation } = useEventMutations()

  const handlePublish = (id: string) => {
    setActionError(null)
    publishMutation.mutate(id, {
      onError: (err: any) => setActionError(err.message || 'Error al publicar el evento.'),
    })
  }

  const handleCancel = (id: string) => {
    setActionError(null)
    cancelMutation.mutate(id, {
      onError: (err: any) => setActionError(err.message || 'Error al cancelar el evento.'),
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteEventId) return
    setActionError(null)
    deleteMutation.mutate(deleteEventId, {
      onSuccess: () => setDeleteEventId(null),
      onError: (err: any) => {
        setActionError(err.message || 'No se puede eliminar el evento.')
        setDeleteEventId(null)
      },
    })
  }

  const filteredEvents = (events || []).filter((e) => {
    const term = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !term ||
      (e.name && e.name.toLowerCase().includes(term)) ||
      (e.venueName && e.venueName.toLowerCase().includes(term)) ||
      (e.city && e.city.toLowerCase().includes(term)) ||
      (e.eventTypeName && e.eventTypeName.toLowerCase().includes(term))

    const currentStatus = normalizeEventStatus(e.status)
    const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden pb-12">
      <PageHeader
        title={isAdmin ? 'Todos los Eventos' : 'Mis Eventos'}
        description={
          isAdmin
            ? 'Supervisa y gestiona todos los eventos publicados y borradores en la plataforma'
            : 'Gestiona publicaciones, boletos y aforos de tus eventos'
        }
      >
        {!isAdmin && (
          <Link to="/events/new">
            <Button variant="default" size="default" className="gap-2 font-bold shadow-md">
              <Plus className="h-4 w-4" />
              Crear Evento
            </Button>
          </Link>
        )}
      </PageHeader>

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between text-xs text-rose-300 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="underline uppercase font-mono text-[10px]">
            Cerrar
          </button>
        </div>
      )}

      {/* Filter and Search Bar matching Stitch prototype */}
      <div className="bg-[#161B22] rounded-2xl p-4 border border-[#30363D] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8B949E]" />
          <input
            type="text"
            placeholder="Search events, venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#30363D] bg-[#0D1117] text-xs font-mono text-[#F0F6FC] placeholder:text-[#6E7681] focus:outline-none focus:border-[#FA4616] transition-colors"
          />
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          {/* Status filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 touch-pan-x">
            {(['ALL', 'DRAFT', 'PUBLISHED', 'CANCELLED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-[#FA4616] text-white shadow-sm'
                    : 'bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#30363D]'
                }`}
              >
                {status === 'ALL'
                  ? 'Todos'
                  : status === 'DRAFT'
                  ? 'Borradores'
                  : status === 'PUBLISHED'
                  ? 'Publicados'
                  : 'Cancelados'}
              </button>
            ))}
          </div>

          {/* Toggle view mode */}
          <div className="hidden sm:flex items-center border border-[#30363D] rounded-xl p-1 bg-[#0D1117]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-[#21262D] text-[#FA4616]' : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
              title="Vista en tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-[#21262D] text-[#FA4616]' : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
              title="Vista en tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Events Presentation */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-[#161B22] rounded-2xl p-12 text-center border border-[#30363D]">
          <p className="text-sm font-semibold text-[#F0F6FC]">No se encontraron eventos</p>
          <p className="text-xs text-[#8B949E] mt-1">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Intenta cambiando los filtros o tu término de búsqueda.'
              : 'Comienza creando tu primer evento.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <EventTable
          events={filteredEvents}
          onPublish={handlePublish}
          onCancel={handleCancel}
          onDelete={(id) => setDeleteEventId(id)}
          isAdmin={isAdmin}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPublish={handlePublish}
              onCancel={handleCancel}
              onDelete={(id) => setDeleteEventId(id)}
              isPublishing={publishMutation.isPending}
              isCancelling={cancelMutation.isPending}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!deleteEventId}
        title="¿Eliminar evento?"
        message="Esta acción no se puede deshacer. Se eliminarán los datos e imágenes asociadas a este borrador."
        confirmText="Eliminar Evento"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteEventId(null)}
      />
    </div>
  )
}

export default EventListPage
