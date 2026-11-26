import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, CheckCircle2, Clock, Ticket, AlertTriangle } from 'lucide-react'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { refundService } from '@/features/refunds/services/refundService'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

interface EventRefundsPanelProps {
  eventId: string
  normalizedStatus: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'FINISHED' | 'RESCHEDULED'
}

export function EventRefundsPanel({ eventId, normalizedStatus }: EventRefundsPanelProps) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const isAffectedStatus =
    normalizedStatus === 'CANCELLED' || normalizedStatus === 'RESCHEDULED'

  const { data: summary, isLoading } = useQuery({
    queryKey: QUERY_KEYS.refunds.eventSummary(eventId),
    queryFn: () => refundService.getEventSummary(eventId),
    enabled: Boolean(eventId) && normalizedStatus !== 'DRAFT',
  })

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.refunds.eventSummary(eventId) })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.refunds.all })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(eventId) })
  }

  const approveMutation = useMutation({
    mutationFn: (refundId: string) => refundService.approve(refundId),
    onSuccess: (res) => {
      setMessage({ ok: true, text: res.message })
      refreshAll()
    },
    onError: (err: Error) => setMessage({ ok: false, text: err.message }),
  })

  const directRefundMutation = useMutation({
    mutationFn: (ticketId: string) => refundService.directRefundTicket(ticketId),
    onSuccess: (res) => {
      setMessage({ ok: true, text: res.message })
      refreshAll()
    },
    onError: (err: Error) => setMessage({ ok: false, text: err.message }),
  })

  const batchRefundMutation = useMutation({
    mutationFn: (onlyRequested: boolean) =>
      refundService.refundAllForEvent(eventId, onlyRequested),
    onSuccess: (res) => {
      setMessage({ ok: true, text: res.message })
      refreshAll()
    },
    onError: (err: Error) => setMessage({ ok: false, text: err.message }),
  })

  if (isLoading || !summary) return null
  if (!isAffectedStatus && summary.totalTickets === 0) return null

  const isBusy =
    approveMutation.isPending ||
    directRefundMutation.isPending ||
    batchRefundMutation.isPending

  return (
    <div className="bg-[#161B22] p-6 rounded-2xl border border-[#30363D] shadow-sm space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#21262D]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-[#FA4616]" />
            <h3 className="text-base font-bold text-[#F0F6FC] font-headline">
              Boletos Vendidos y Gestión de Reembolsos
            </h3>
          </div>
          <p className="text-xs text-[#8B949E]">
            {normalizedStatus === 'CANCELLED'
              ? 'Evento cancelado: aprueba las solicitudes de reembolso o devuelve el dinero a todos los compradores activos.'
              : normalizedStatus === 'RESCHEDULED'
                ? 'Evento reprogramado: los compradores pueden elegir conservar su boleto para la nueva fecha o solicitar el reembolso de su dinero.'
                : 'Estado actual de los boletos emitidos para este evento.'}
          </p>
        </div>

        {isAffectedStatus && summary.totalTickets > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {summary.pendingRefundsCount > 0 && (
              <Button
                size="sm"
                onClick={() => batchRefundMutation.mutate(true)}
                disabled={isBusy}
                className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                Reembolsar solicitados ({summary.pendingRefundsCount})
              </Button>
            )}

            {normalizedStatus === 'CANCELLED' && summary.validTickets > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => batchRefundMutation.mutate(false)}
                disabled={isBusy}
                className="gap-1.5 text-xs font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                Reembolsar todos los boletos ({summary.validTickets})
              </Button>
            )}
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            message.ok
              ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800/70 text-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-[11px] font-mono uppercase underline ml-3"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Mini Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0D1117] p-3.5 rounded-xl border border-[#21262D]">
          <span className="text-[10px] font-mono uppercase text-[#8B949E]">Boletos emitidos</span>
          <p className="text-lg font-headline font-bold text-[#F0F6FC] tabular-nums mt-0.5">
            {summary.totalTickets}
          </p>
        </div>
        <div className="bg-[#0D1117] p-3.5 rounded-xl border border-[#21262D]">
          <span className="text-[10px] font-mono uppercase text-amber-400">Reembolso solicitado</span>
          <p className="text-lg font-headline font-bold text-amber-300 tabular-nums mt-0.5">
            {summary.pendingRefundsCount}{' '}
            <span className="text-xs font-normal text-[#8B949E]">
              ({formatCurrency(summary.pendingRefundAmount)})
            </span>
          </p>
        </div>
        <div className="bg-[#0D1117] p-3.5 rounded-xl border border-[#21262D]">
          <span className="text-[10px] font-mono uppercase text-purple-400">Mantienen boleto</span>
          <p className="text-lg font-headline font-bold text-purple-300 tabular-nums mt-0.5">
            {summary.keptCount}
          </p>
        </div>
        <div className="bg-[#0D1117] p-3.5 rounded-xl border border-[#21262D]">
          <span className="text-[10px] font-mono uppercase text-emerald-400">Reembolsados</span>
          <p className="text-lg font-headline font-bold text-emerald-300 tabular-nums mt-0.5">
            {summary.refundedCount}{' '}
            <span className="text-xs font-normal text-[#8B949E]">
              ({formatCurrency(summary.totalRefundedAmount)})
            </span>
          </p>
        </div>
      </div>

      {/* Tickets & Refund Decisions Table */}
      {summary.tickets.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#0D1117] border border-dashed border-[#30363D] text-center text-xs text-[#8B949E]">
          Este evento aún no registra boletos vendidos.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#30363D] bg-[#0D1117]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#21262D] text-[10px] font-mono uppercase text-[#8B949E]">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Asistente</th>
                <th className="py-3 px-4">Sección / Precio</th>
                <th className="py-3 px-4">Estado / Decisión</th>
                {isAffectedStatus && <th className="py-3 px-4 text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262D] text-xs">
              {summary.tickets.map((row) => (
                <tr key={row.ticketId} className="hover:bg-[#161B22]/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#F0F6FC]">
                    {row.ticketCode}
                    <span className="block text-[10px] font-normal text-[#8B949E]">
                      {row.orderReference}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-[#F0F6FC]">{row.attendeeName}</span>
                    <span className="block text-[11px] font-mono text-[#8B949E]">
                      {row.attendeeEmail}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[#F0F6FC]">{row.sectionName}</span>
                    <span className="block font-mono font-bold text-[#F5A894] tabular-nums">
                      {formatCurrency(row.price)} MXN
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {row.refundStatus === 'REFUNDED' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> REEMBOLSADO
                      </span>
                    ) : row.refundStatus === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-700/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                        <Clock className="w-3 h-3" /> SOLICITÓ REEMBOLSO
                      </span>
                    ) : row.refundStatus === 'KEPT' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-950/60 border border-purple-700/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-300">
                        <Ticket className="w-3 h-3" /> MANTIENE BOLETO
                      </span>
                    ) : row.ticketStatus === 'USED' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                        USADO EN ACCESO
                      </span>
                    ) : row.ticketStatus === 'CANCELLED' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/60 border border-rose-700/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-rose-300">
                        <AlertTriangle className="w-3 h-3" /> CANCELADO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#161B22] border border-[#30363D] px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[#8B949E]">
                        ACTIVO {isAffectedStatus ? '• SIN DECISIÓN' : ''}
                      </span>
                    )}
                  </td>
                  {isAffectedStatus && (
                    <td className="py-3 px-4 text-right">
                      {row.refundStatus === 'PENDING' && row.refundId ? (
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(row.refundId!)}
                          disabled={isBusy}
                          className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                        >
                          Aprobar reembolso
                        </Button>
                      ) : row.ticketStatus === 'VALID' && row.refundStatus !== 'REFUNDED' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => directRefundMutation.mutate(row.ticketId)}
                          disabled={isBusy}
                          className="h-7 text-[11px] border border-[#30363D] hover:border-[#FA4616] text-[#F0F6FC]"
                        >
                          Reembolsar dinero
                        </Button>
                      ) : (
                        <span className="text-[11px] font-mono text-[#6E7681]">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
