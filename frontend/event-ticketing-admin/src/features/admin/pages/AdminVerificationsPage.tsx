import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, ShieldCheck, Mail, Building, FileText, Landmark, ExternalLink } from 'lucide-react'
import { adminService } from '../services/adminService'
import type { OrganizerVerificationDetailDto, VerificationLevel } from '@/types/api'

const LEVELS: VerificationLevel[] = ['Basic', 'Pro', 'Enterprise']

const LEVEL_DESCRIPTIONS: Record<VerificationLevel, string> = {
  Unverified: 'Borradores únicamente',
  Basic: 'Hasta 500 asistentes',
  Pro: 'Hasta 5,000 asistentes',
  Enterprise: 'Capacidad sin límite',
}

function VerificationRow({ item }: { item: OrganizerVerificationDetailDto }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [level, setLevel] = useState<VerificationLevel>('Basic')
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null)

  const approve = useMutation({
    mutationFn: () => adminService.approveOrganizer(item.organizerId, { level, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-verifications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'organizers'] })
    },
  })

  const reject = useMutation({
    mutationFn: () => adminService.rejectOrganizer(item.organizerId, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-verifications'] })
      qc.invalidateQueries({ queryKey: ['admin', 'organizers'] })
    },
  })

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden shadow-sm transition-all">
      {/* Header row */}
      <div
        className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FA4616]/10 text-[#FA4616] font-bold text-sm border border-[#FA4616]/20">
            {item.organizerName?.[0]?.toUpperCase() || 'O'}
          </div>
          <div>
            <p className="font-semibold text-sm text-[var(--text-primary)]">{item.organizerName}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{item.email}</span>
              <span className="opacity-40">•</span>
              <span className="font-mono">RFC: {item.taxId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            {new Date(item.submittedAt).toLocaleDateString('es-MX', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <div className="p-1 rounded-lg text-[var(--text-secondary)]">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-main)] p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-mono mb-1">
                Nombre Legal / Razón Social
              </span>
              <span className="font-medium text-[var(--text-primary)] text-sm">{item.legalName}</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-mono mb-1">
                RFC Fiscal
              </span>
              <span className="font-mono font-medium text-[var(--text-primary)] text-sm">{item.taxId}</span>
            </div>

            {item.clabeAccount && (
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-mono mb-1">
                  CLABE Interbancaria
                </span>
                <span className="font-mono font-medium text-[var(--text-primary)] text-sm">{item.clabeAccount}</span>
              </div>
            )}

            {item.companyDocumentUrl && (
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-mono mb-1">
                  Documento Constitutivo
                </span>
                <a
                  href={item.companyDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#FA4616] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  Ver documento adjunto <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!mode && (
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setMode('approve')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                <CheckCircle className="w-4 h-4" /> Aprobar verificación
              </button>
              <button
                onClick={() => setMode('reject')}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition cursor-pointer shadow-sm shadow-rose-600/20"
              >
                <XCircle className="w-4 h-4" /> Rechazar
              </button>
            </div>
          )}

          {/* Approve form */}
          {mode === 'approve' && (
            <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Nivel de verificación a asignar *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as VerificationLevel)}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] w-full focus:outline-none focus:border-[#FA4616]"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l} — {LEVEL_DESCRIPTIONS[l]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Notas internas de revisión (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] w-full resize-none focus:outline-none focus:border-[#FA4616]"
                  placeholder="Ej. Documentación cotejada contra SAT, CLABE verificada correctamente."
                />
              </div>

              {approve.isError && (
                <p className="text-rose-500 text-xs">Error al aprobar: {approve.error?.message}</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  {approve.isPending ? 'Guardando...' : 'Confirmar aprobación'}
                </button>
                <button
                  onClick={() => setMode(null)}
                  className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Reject form */}
          {mode === 'reject' && (
            <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
              <div>
                <label className="block text-xs font-semibold text-rose-500 mb-1.5">
                  Motivo de rechazo * (visible para el organizador)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="rounded-xl border border-rose-500/30 bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] w-full resize-none focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  placeholder="Ej. El RFC capturado no coincide con la constancia de situación fiscal adjunta."
                />
              </div>

              {reject.isError && (
                <p className="text-rose-500 text-xs">Error al rechazar: {reject.error?.message}</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => reject.mutate()}
                  disabled={reject.isPending || !reason.trim()}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  {reject.isPending ? 'Guardando...' : 'Confirmar rechazo'}
                </button>
                <button
                  onClick={() => setMode(null)}
                  className="px-4 py-2 border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminVerificationsPage() {
  const { data, isLoading } = useQuery<OrganizerVerificationDetailDto[]>({
    queryKey: ['pending-verifications'],
    queryFn: adminService.getPendingVerifications,
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <ShieldCheck className="w-6 h-6 text-[#FA4616]" />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Solicitudes de verificación
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Revisa y gestiona las solicitudes de verificación KYC pendientes de organizadores
        </p>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-xs text-[var(--text-secondary)] font-mono">
          Cargando solicitudes...
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-16 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
          <p className="text-base font-semibold text-[var(--text-primary)]">No hay solicitudes pendientes</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Todas las solicitudes de verificación han sido atendidas.
          </p>
        </div>
      )}

      <div className="space-y-3.5">
        {data?.map((item) => (
          <VerificationRow key={item.organizerId} item={item} />
        ))}
      </div>
    </div>
  )
}
