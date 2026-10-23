import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CalendarClock, AlertCircle, Info } from 'lucide-react'
import type { EventDetailDto, RescheduleEventDto } from '@/types/api'

interface RescheduleModalProps {
  open: boolean
  event: EventDetailDto | null
  isLoading?: boolean
  onClose: () => void
  onConfirm: (data: RescheduleEventDto) => void
}

export function RescheduleModal({
  open,
  event,
  isLoading = false,
  onClose,
  onConfirm,
}: RescheduleModalProps) {
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (event && open) {
      // Pre-cargar valores actuales
      const sDate = event.startDate ? event.startDate.substring(0, 10) : ''
      const eDate = event.endDate ? event.endDate.substring(0, 10) : sDate
      const sTime = event.startTime ? event.startTime.substring(0, 5) : '19:00'
      const eTime = event.endTime ? event.endTime.substring(0, 5) : '22:00'

      setStartDate(sDate)
      setEndDate(eDate)
      setStartTime(sTime)
      setEndTime(eTime)
      setReason('')
      setError(null)
    }
  }, [event, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!startDate || !startTime) {
      setError('Debes especificar la nueva fecha y hora de inicio.')
      return
    }

    const finalEndDate = endDate || startDate
    const finalEndTime = endTime || startTime

    // Validar que la fecha/hora de fin no sea anterior a inicio
    const startIso = `${startDate}T${startTime}:00`
    const endIso = `${finalEndDate}T${finalEndTime}:00`
    if (new Date(endIso) < new Date(startIso)) {
      setError('La fecha y hora de finalización debe ser posterior a la de inicio.')
      return
    }

    onConfirm({
      startDate: `${startDate}T00:00:00Z`,
      endDate: `${finalEndDate}T00:00:00Z`,
      startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime: finalEndTime.length === 5 ? `${finalEndTime}:00` : finalEndTime,
      reason: reason.trim() || undefined,
    })
  }

  if (!event) return null

  return (
    <Dialog open={open} onClose={onClose} title={null}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3.5 pb-3 border-b border-[#30363D]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-950/50 text-purple-300 border border-purple-700/50 shadow-inner">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-[#F0F6FC] font-headline">
              Reprogramar Evento
            </h3>
            <p className="text-xs text-[#8B949E] line-clamp-1">
              {event.name}
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-start gap-2.5 text-xs text-purple-200">
          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Al reprogramar el evento, su estado cambiará a{' '}
            <strong className="text-purple-300 font-mono">REPROGRAMADO</strong>{' '}
            y se actualizará la fecha en la cartelera. Los boletos ya adquiridos permanecerán válidos para la nueva fecha.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/70 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Inputs Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                Nueva fecha de inicio *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="bg-[#0D1117] border-[#30363D] text-[#F0F6FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                Nueva hora de inicio *
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="bg-[#0D1117] border-[#30363D] text-[#F0F6FC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                Fecha de fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#0D1117] border-[#30363D] text-[#F0F6FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
                Hora de fin
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-[#0D1117] border-[#30363D] text-[#F0F6FC]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B949E] mb-1.5">
              Motivo de la reprogramación (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Por causas de fuerza mayor o cambios de agenda de los artistas..."
              rows={2}
              className="w-full rounded-xl bg-[#0D1117] border border-[#30363D] px-3 py-2 text-xs text-[#F0F6FC] placeholder:text-[#6E7681] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#30363D]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isLoading}
            className="font-bold bg-purple-600 hover:bg-purple-500 text-white border-0 shadow-lg shadow-purple-900/30 gap-1.5"
          >
            <CalendarClock className="w-4 h-4" />
            Confirmar Reprogramación
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
