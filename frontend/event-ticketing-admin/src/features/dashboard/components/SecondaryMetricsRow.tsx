import { Ticket, Calendar, Radio } from 'lucide-react'

interface SecondaryMetricsRowProps {
  totalTicketsSold: number
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  cancelledEvents: number
}

export function SecondaryMetricsRow({
  totalTicketsSold,
  totalEvents,
  publishedEvents,
  draftEvents,
  cancelledEvents,
}: SecondaryMetricsRowProps) {
  const publishRatio = totalEvents > 0 
    ? Math.round((publishedEvents / totalEvents) * 100) 
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. 🎟️ Boletos emitidos */}
      <div className="rounded-2xl bg-[#1A1D24] border border-[#30363D] p-5 shadow-sm hover:border-[#484F58] transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#8B949E]">
              🎟️ Boletos emitidos
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-[#F0F6FC] font-headline">
                {totalTicketsSold.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-[#8B949E]">boletos vendidos</span>
            </div>
          </div>

          <div className="h-11 w-11 shrink-0 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35]/30 flex items-center justify-center text-[#FF6B35] group-hover:scale-105 transition-transform">
            <Ticket className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#21262D]">
          <p className="text-xs text-[#8B949E]">
            {totalTicketsSold === 0 ? (
              <span className="text-[#8B949E]">"Ningún boleto vendido todavía"</span>
            ) : (
              <span className="text-[#2ECC71]">
                ✓ {totalTicketsSold.toLocaleString()} accesos QR confirmados
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 2. 📅 Eventos totales */}
      <div className="rounded-2xl bg-[#1A1D24] border border-[#30363D] p-5 shadow-sm hover:border-[#484F58] transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#8B949E]">
              📅 Eventos totales
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-[#F0F6FC] font-headline">
                {totalEvents}
              </span>
              <span className="text-xs font-medium text-[#8B949E]">eventos creados</span>
            </div>
          </div>

          <div className="h-11 w-11 shrink-0 rounded-full bg-[#003087]/30 border border-[#003087]/50 flex items-center justify-center text-[#8DA4EF] group-hover:scale-105 transition-transform">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#21262D]">
          <p className="text-xs text-[#8B949E]">
            {totalEvents === 0 ? (
              <span>"Aún no tienes eventos registrados"</span>
            ) : (
              <span>
                "{draftEvents} en preparación
                {cancelledEvents > 0 ? `, ${cancelledEvents} cancelado${cancelledEvents > 1 ? 's' : ''}` : ''}"
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 3. 📊 En cartelera */}
      <div className="rounded-2xl bg-[#1A1D24] border border-[#30363D] p-5 shadow-sm hover:border-[#484F58] transition-all flex flex-col justify-between group">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#8B949E]">
              📊 En cartelera
            </p>
            <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-2xl lg:text-3xl font-extrabold text-[#2ECC71] font-headline">
                {publishedEvents}
              </span>
              <span className="text-xs font-medium text-[#F0F6FC]">activos /</span>
              <span className="text-base font-bold text-[#F5A623]">
                {draftEvents}
              </span>
              <span className="text-xs text-[#8B949E]">en borrador</span>
            </div>
          </div>

          <div className="h-11 w-11 shrink-0 rounded-full bg-[#2ECC71]/15 border border-[#2ECC71]/30 flex items-center justify-center text-[#2ECC71] group-hover:scale-105 transition-transform">
            <Radio className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#21262D]">
          <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
            <span>
              {publishedEvents === 0
                ? "Aún no tienes eventos publicados"
                : `${publishRatio}% de disponibilidad`}
            </span>
            <span className="font-mono text-[11px]">{publishedEvents}/{totalEvents}</span>
          </div>
          <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2ECC71] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(publishRatio, totalEvents > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
