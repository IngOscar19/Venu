import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/adminService'
import { PageHeader } from '@/components/shared/PageHeader'
import type { OrganizerAdminDto, VerificationLevel, OrganizerStatus } from '@/types/api'
import { ShieldCheck, ShieldX, Search, ChevronDown } from 'lucide-react'

const LEVEL_LABELS: Record<VerificationLevel, string> = {
  Unverified: 'Sin verificar',
  Basic: 'Básico',
  Pro: 'Pro',
  Enterprise: 'Enterprise',
}

const LEVEL_COLORS: Record<VerificationLevel, string> = {
  Unverified: 'text-[#8B949E] bg-[#21262D] border border-[#30363D]',
  Basic: 'text-blue-400 bg-blue-950/40 border border-blue-800/60',
  Pro: 'text-orange-400 bg-orange-950/40 border border-orange-800/60',
  Enterprise: 'text-purple-400 bg-purple-950/40 border border-purple-800/60',
}

const STATUS_COLORS: Record<OrganizerStatus, string> = {
  PENDING: 'text-amber-400 bg-amber-950/40 border border-amber-800/60',
  VERIFIED: 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/60',
  REJECTED: 'text-rose-400 bg-rose-950/40 border border-rose-800/60',
  SUSPENDED: 'text-rose-400 bg-rose-950/40 border border-rose-800/60',
  UNVERIFIED: 'text-slate-400 bg-slate-800/40 border border-slate-700/60',
}

const STATUS_LABELS: Record<OrganizerStatus, string> = {
  PENDING: 'Pendiente',
  VERIFIED: 'Verificado',
  REJECTED: 'Rechazado',
  SUSPENDED: 'Suspendido',
  UNVERIFIED: 'Sin verificar',
}

const LEVELS: VerificationLevel[] = ['Unverified', 'Basic', 'Pro', 'Enterprise']

export function AdminOrganizersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrganizerStatus | ''>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<VerificationLevel>('Unverified')
  const [suspendId, setSuspendId] = useState<string | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [feedback, setFeedback] = useState<{ id: string; msg: string } | null>(null)

  const { data: organizers = [], isLoading } = useQuery({
    queryKey: ['admin', 'organizers', search, statusFilter],
    queryFn: () =>
      adminService.getOrganizers({
        search: search || undefined,
        status: (statusFilter as OrganizerStatus) || undefined,
      }),
  })

  const updateLevel = useMutation({
    mutationFn: ({ id, level }: { id: string; level: VerificationLevel }) =>
      adminService.updateVerificationLevel(id, { verificationLevel: level }),
    onSuccess: (_, { id, level }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizers'] })
      setEditingId(null)
      setFeedback({ id, msg: `Nivel actualizado a ${LEVEL_LABELS[level]}` })
      setTimeout(() => setFeedback(null), 3000)
    },
  })

  const suspend = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.suspendOrganizer(id, { reason }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizers'] })
      setSuspendId(null)
      setSuspendReason('')
      setFeedback({ id, msg: 'Organizador suspendido' })
      setTimeout(() => setFeedback(null), 3000)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Organizadores"
        description="Verifica identidad, asigna niveles y administra el acceso a la plataforma"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E7681]" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#30363D] bg-[#161B22] text-[#F0F6FC] placeholder:text-[#6E7681] focus:outline-none focus:border-[#FA4616]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrganizerStatus | '')}
          className="px-3 py-2 text-sm rounded-xl border border-[#30363D] bg-[#161B22] text-[#F0F6FC] focus:outline-none focus:border-[#FA4616]"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="VERIFIED">Verificado</option>
          <option value="REJECTED">Rechazado</option>
          <option value="SUSPENDED">Suspendido</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#30363D] bg-[#161B22]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#21262D] bg-[#0D1117] text-[10px] font-mono font-medium text-[#8B949E] uppercase tracking-wider">
              <th className="py-3.5 pl-4 pr-3">Organizador</th>
              <th className="py-3.5 px-3">Estado</th>
              <th className="py-3.5 px-3">Nivel</th>
              <th className="py-3.5 px-3">Registro</th>
              <th className="py-3.5 pl-3 pr-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262D]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-[#8B949E] font-mono">
                  Cargando organizadores...
                </td>
              </tr>
            ) : organizers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-[#8B949E] font-mono">
                  No se encontraron organizadores
                </td>
              </tr>
            ) : (
              organizers.map((org) => (
                <OrganizerRow
                  key={org.id}
                  org={org}
                  isEditing={editingId === org.id}
                  selectedLevel={editingId === org.id ? selectedLevel : org.verificationLevel}
                  isSuspending={suspendId === org.id}
                  suspendReason={suspendReason}
                  feedback={feedback?.id === org.id ? feedback.msg : null}
                  isUpdating={updateLevel.isPending}
                  isSuspendingMutation={suspend.isPending}
                  onEditLevel={() => {
                    setEditingId(org.id)
                    setSelectedLevel(org.verificationLevel)
                  }}
                  onLevelChange={setSelectedLevel}
                  onConfirmLevel={() =>
                    updateLevel.mutate({ id: org.id, level: selectedLevel })
                  }
                  onCancelEdit={() => setEditingId(null)}
                  onStartSuspend={() => {
                    setSuspendId(org.id)
                    setSuspendReason('')
                  }}
                  onSuspendReasonChange={setSuspendReason}
                  onConfirmSuspend={() =>
                    suspend.mutate({ id: org.id, reason: suspendReason })
                  }
                  onCancelSuspend={() => setSuspendId(null)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Row subcomponent ───────────────────────────────────────────────────────

interface RowProps {
  org: OrganizerAdminDto
  isEditing: boolean
  selectedLevel: VerificationLevel
  isSuspending: boolean
  suspendReason: string
  feedback: string | null
  isUpdating: boolean
  isSuspendingMutation: boolean
  onEditLevel: () => void
  onLevelChange: (l: VerificationLevel) => void
  onConfirmLevel: () => void
  onCancelEdit: () => void
  onStartSuspend: () => void
  onSuspendReasonChange: (r: string) => void
  onConfirmSuspend: () => void
  onCancelSuspend: () => void
}

function OrganizerRow({
  org, isEditing, selectedLevel, isSuspending, suspendReason,
  feedback, isUpdating, isSuspendingMutation,
  onEditLevel, onLevelChange, onConfirmLevel, onCancelEdit,
  onStartSuspend, onSuspendReasonChange, onConfirmSuspend, onCancelSuspend,
}: RowProps) {
  const status = org.status as OrganizerStatus
  const level = org.verificationLevel as VerificationLevel

  return (
    <>
      <tr className="hover:bg-[#21262D]/60 transition-colors">
        {/* Organizer info */}
        <td className="py-4 pl-4 pr-3">
          <p className="font-semibold text-[#F0F6FC]">{org.name}</p>
          <p className="text-[11px] text-[#8B949E] font-mono mt-0.5">{org.email}</p>
          <p className="text-[11px] text-[#6E7681]">{org.firstName} {org.lastName}</p>
        </td>

        {/* Status badge */}
        <td className="py-4 px-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </td>

        {/* Level — inline edit */}
        <td className="py-4 px-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => onLevelChange(e.target.value as VerificationLevel)}
                className="px-2 py-1 text-xs rounded-lg border border-[#FA4616]/60 bg-[#0D1117] text-[#F0F6FC] focus:outline-none"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
                ))}
              </select>
              <button
                onClick={onConfirmLevel}
                disabled={isUpdating}
                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-[#FA4616] text-white hover:bg-[#e03d12] disabled:opacity-50 transition-colors"
              >
                {isUpdating ? '...' : 'OK'}
              </button>
              <button
                onClick={onCancelEdit}
                className="px-2 py-1 text-[11px] rounded-lg text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={onEditLevel}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium transition-colors hover:opacity-80 ${LEVEL_COLORS[level]}`}
            >
              {level === 'Unverified' ? <ShieldX className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
              {LEVEL_LABELS[level]}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          )}
        </td>

        {/* Date */}
        <td className="py-4 px-3 text-[11px] text-[#8B949E] font-mono">
          {new Date(org.createdAt).toLocaleDateString()}
        </td>

        {/* Actions */}
        <td className="py-4 pl-3 pr-4 text-right">
          {feedback ? (
            <span className="text-[11px] text-emerald-400 font-mono">{feedback}</span>
          ) : status !== 'SUSPENDED' ? (
            <button
              onClick={onStartSuspend}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-rose-800/60 text-rose-400 hover:bg-rose-950/40 transition-colors font-medium"
            >
              Suspender
            </button>
          ) : (
            <span className="text-[11px] text-[#6E7681] font-mono">Suspendido</span>
          )}
        </td>
      </tr>

      {/* Suspend confirmation row */}
      {isSuspending && (
        <tr className="bg-rose-950/20">
          <td colSpan={5} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Motivo de la suspensión..."
                value={suspendReason}
                onChange={(e) => onSuspendReasonChange(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-rose-800/60 bg-[#0D1117] text-[#F0F6FC] placeholder:text-[#6E7681] focus:outline-none"
              />
              <button
                onClick={onConfirmSuspend}
                disabled={!suspendReason.trim() || isSuspendingMutation}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={onCancelSuspend}
                className="px-3 py-1.5 text-xs rounded-lg text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default AdminOrganizersPage
