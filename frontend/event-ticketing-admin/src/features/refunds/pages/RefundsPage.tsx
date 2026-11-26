import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Ticket,
  DollarSign,
  CalendarClock,
  ExternalLink,
} from 'lucide-react'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { refundService } from '../services/refundService'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils'
import type { RefundStatus } from '@/types/api'

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Reembolsados', value: 'REFUNDED' },
  { label: 'Boleto conservado', value: 'KEPT' },
  { label: 'Rechazados', value: 'REJECTED' },
]

function renderRefundBadge(status: RefundStatus) {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-700/60 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-300">
          <Clock className="w-3 h-3" />
          PENDIENTE
        </span>
      )
    case 'REFUNDED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-300">
          <CheckCircle2 className="w-3 h-3" />
          REEMBOLSADO
        </span>
      )
    case 'KEPT':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-950/60 border border-purple-700/60 px-2.5 py-0.5 text-[11px] font-mono font-bold text-purple-300">
          <Ticket className="w-3 h-3" />
          CONSERVÓ BOLETO
        </span>
      )
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/60 border border-rose-700/60 px-2.5 py-0.5 text-[11px] font-mono font-bold text-rose-300">
          <XCircle className="w-3 h-3" />
          RECHAZADO
        </span>
      )
  }
}

export function RefundsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.refunds.list({ status: statusFilter }),
    queryFn: () =>
      refundService.getAll(statusFilter === 'ALL' ? undefined : { status: statusFilter }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => refundService.approve(id),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.refunds.all })
    },
    onError: (err: Error) => {
      setFeedback({ type: 'err', text: err.message })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      refundService.reject(id, 'Solicitud rechazada; el boleto permanece válido.'),
    onSuccess: (res) => {
      setFeedback({ type: 'ok', text: res.message })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.refunds.all })
    },
    onError: (err: Error) => {
      setFeedback({ type: 'err', text: err.message })
    },
  })

  const filtered = items.filter((item) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      item.eventName.toLowerCase().includes(q) ||
      item.ticketCode.toLowerCase().includes(q) ||
      item.attendeeName.toLowerCase().includes(q) ||
      item.attendeeEmail.toLowerCase().includes(q) ||
      item.orderReference.toLowerCase().includes(q)
    )
  })

  const pendingCount = items.filter((i) => i.status === 'PENDING').length
  const refundedCount = items.filter((i) => i.status === 'REFUNDED').length
  const keptCount = items.filter((i) => i.status === 'KEPT').length
  const totalRefundedAmount = items
    .filter((i) => i.status === 'REFUNDED')
    .reduce((acc, i) => acc + i.amount, 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F6FC] font-headline tracking-tight flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-[#FA4616]" />
            Reembolsos y Cambios de Fecha
          </h1>
          <p className="text-xs text-[#8B949E] mt-1">
            Gestiona solicitudes de devolución de dinero o confirmación de boletos en eventos reprogramados o cancelados.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === 'ok'
              ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800/70 text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-mono uppercase underline opacity-80 hover:opacity-100"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161B22] p-5 rounded-2xl border border-[#30363D] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-950/50 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-[#8B949E]">Solicitudes pendientes</p>
            <p className="text-xl font-headline font-bold text-[#F0F6FC] tabular-nums mt-0.5">
              {pendingCount}
            </p>
          </div>
        </div>

        <div className="bg-[#161B22] p-5 rounded-2xl border border-[#30363D] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-[#8B949E]">Boletos reembolsados</p>
            <p className="text-xl font-headline font-bold text-[#F0F6FC] tabular-nums mt-0.5">
              {refundedCount}
            </p>
          </div>
        </div>

        <div className="bg-[#161B22] p-5 rounded-2xl border border-[#30363D] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FA4616]/15 text-[#FA4616] flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-[#8B949E]">Monto reembolsado</p>
            <p className="text-lg font-headline font-bold text-[#F0F6FC] tabular-nums mt-0.5">
              {formatCurrency(totalRefundedAmount)} MXN
            </p>
          </div>
        </div>

        <div className="bg-[#161B22] p-5 rounded-2xl border border-[#30363D] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-950/50 text-purple-400 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-[#8B949E]">Boletos conservados</p>
            <p className="text-xl font-headline font-bold text-[#F0F6FC] tabular-nums mt-0.5">
              {keptCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#161B22] p-4 rounded-2xl border border-[#30363D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-[#FA4616] text-white font-semibold'
                  : 'bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC] border border-[#30363D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#8B949E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar boleto, asistente o evento..."
            className="w-full rounded-xl bg-[#0D1117] border border-[#30363D] pl-9 pr-3 py-2 text-xs text-[#F0F6FC] placeholder:text-[#6E7681] focus:outline-none focus:border-[#FA4616]"
          />
        </div>
      </div>

      {/* Table / List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-12 text-center space-y-2">
          <RotateCcw className="w-10 h-10 text-[#6E7681] mx-auto" />
          <p className="text-sm font-semibold text-[#F0F6FC]">
            No hay solicitudes registradas en esta vista
          </p>
          <p className="text-xs text-[#8B949E] max-w-md mx-auto">
            Cuando un evento se reprograme o se cancele, las solicitudes de reembolso o confirmaciones de asistencia aparecerán aquí. También puedes gestionar boletos directamente desde el detalle de cada evento.
          </p>
        </div>
      ) : (
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#21262D] bg-[#0D1117] text-[10px] font-mono uppercase text-[#8B949E]">
                  <th className="py-3.5 px-4">Evento / Causa</th>
                  <th className="py-3.5 px-4">Boleto / Sección</th>
                  <th className="py-3.5 px-4">Comprador</th>
                  <th className="py-3.5 px-4">Importe</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262D] text-xs">
                {filtered.map((item) => {
                  const isBusy = approveMutation.isPending || rejectMutation.isPending
                  return (
                    <tr key={item.id} className="hover:bg-[#21262D]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/events/${item.eventId}`}
                          className="font-semibold text-[#F0F6FC] hover:text-[#FA4616] inline-flex items-center gap-1"
                        >
                          <span>{item.eventName}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </Link>
                        <div className="text-[11px] text-[#8B949E] mt-0.5 font-mono">
                          {item.eventTriggerStatus === 'CANCELLED'
                            ? 'Por cancelación'
                            : 'Por reprogramación'}
                        </div>
                        {item.reason && (
                          <div className="text-[11px] text-[#8B949E] italic mt-1 line-clamp-1">
                            “{item.reason}”
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-[#F0F6FC]">{item.ticketCode}</div>
                        <div className="text-[11px] text-[#8B949E]">
                          {item.sectionName} • {item.orderReference}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#F0F6FC]">{item.attendeeName}</div>
                        <div className="text-[11px] font-mono text-[#8B949E]">
                          {item.attendeeEmail}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-headline font-bold text-[#F5A894] tabular-nums">
                        {formatCurrency(item.amount)} MXN
                      </td>

                      <td className="py-3.5 px-4">{renderRefundBadge(item.status)}</td>

                      <td className="py-3.5 px-4 text-right">
                        {item.status === 'PENDING' ? (
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(item.id)}
                              disabled={isBusy}
                              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                            >
                              Reembolsar dinero
                            </Button>
                            {item.eventStatus !== 'CANCELLED' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => rejectMutation.mutate(item.id)}
                                disabled={isBusy}
                                className="h-8 text-xs border border-[#30363D]"
                              >
                                Mantener boleto
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-[#6E7681]">
                            {item.resolvedAt
                              ? new Date(item.resolvedAt).toLocaleDateString()
                              : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default RefundsPage
