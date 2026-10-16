import { Link } from 'react-router-dom'
import { ArrowRight, Layers } from 'lucide-react'

interface BillboardDonutSummaryProps {
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  cancelledEvents: number
}

export function BillboardDonutSummary({
  totalEvents,
  publishedEvents,
  draftEvents,
  cancelledEvents,
}: BillboardDonutSummaryProps) {
  const publishRatio = totalEvents > 0 
    ? Math.round((publishedEvents / totalEvents) * 100) 
    : 0

  // Donut SVG parameters
  const size = 160
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Angles and segments
  const publishedRatio = totalEvents > 0 ? publishedEvents / totalEvents : 0
  const draftRatio = totalEvents > 0 ? draftEvents / totalEvents : 0
  const cancelledRatio = totalEvents > 0 ? cancelledEvents / totalEvents : 0

  const publishedDash = publishedRatio * circumference
  const draftDash = draftRatio * circumference
  const cancelledDash = cancelledRatio * circumference

  // Offsets
  // Segment 1 (Published): starts at 0 (top because rotated -90deg)
  const offsetPublished = 0
  // Segment 2 (Draft): starts after Published
  const offsetDraft = -publishedDash
  // Segment 3 (Cancelled): starts after Published + Draft
  const offsetCancelled = -(publishedDash + draftDash)

  return (
    <div className="rounded-3xl bg-[#1A1D24] border border-[#30363D] p-6 shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#21262D]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#FF5A1F]">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F0F6FC] font-headline">
                Estado de Cartelera
              </h3>
              <p className="text-xs text-[#8B949E]">
                Publicados vs Borradores
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-[#21262D] text-[#8B949E] border border-[#30363D]">
            {totalEvents} total
          </span>
        </div>

        {/* Donut + Leyenda */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-6">
          {/* Anillo de progreso SVG */}
          <div className="relative flex items-center justify-center pointer-events-none select-none">
            <svg
              width={size}
              height={size}
              className="rotate-[-90deg] transition-all duration-700 ease-out pointer-events-none"
            >
              {/* Background ring adaptable al tema */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-[#21262D] dark:text-[#21262D]"
                style={{ stroke: 'var(--border-color)' }}
                strokeWidth={strokeWidth}
              />

              {totalEvents > 0 && (
                <>
                  {/* Segment: Published (Verde #2ECC71) */}
                  {publishedRatio > 0 && (
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke="#2ECC71"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${publishedDash} ${circumference - publishedDash}`}
                      strokeDashoffset={offsetPublished}
                      strokeLinecap={totalEvents === publishedEvents ? 'butt' : 'round'}
                      className="transition-all duration-700"
                    />
                  )}

                  {/* Segment: Draft (Naranja / Ámbar #FF6B35) */}
                  {draftRatio > 0 && (
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke="#FF6B35"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${draftDash} ${circumference - draftDash}`}
                      strokeDashoffset={offsetDraft}
                      strokeLinecap={totalEvents === draftEvents ? 'butt' : 'round'}
                      className="transition-all duration-700"
                    />
                  )}

                  {/* Segment: Cancelled (Rojo #E74C3C) */}
                  {cancelledRatio > 0 && (
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke="#E74C3C"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${cancelledDash} ${circumference - cancelledDash}`}
                      strokeDashoffset={offsetCancelled}
                      strokeLinecap={totalEvents === cancelledEvents ? 'butt' : 'round'}
                      className="transition-all duration-700"
                    />
                  )}
                </>
              )}
            </svg>

            {/* Centro del donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-3xl font-black text-[#F0F6FC] font-headline leading-none">
                {publishRatio}%
              </span>
              <span className="text-[10px] font-mono text-[#8B949E] uppercase mt-1">
                Publicados
              </span>
            </div>
          </div>

          {/* Leyenda clara y accesible */}
          <div className="space-y-3 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-3 text-xs bg-[#21262D]/40 px-3 py-2 rounded-xl border border-[#30363D]/40">
              <span className="flex items-center gap-2 text-[#F0F6FC] font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2ECC71] shadow-[0_0_8px_#2ECC71]" />
                Publicados
              </span>
              <span className="font-mono font-bold text-[#2ECC71] ml-auto">
                {publishedEvents}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-3 text-xs bg-[#21262D]/40 px-3 py-2 rounded-xl border border-[#30363D]/40">
              <span className="flex items-center gap-2 text-[#F0F6FC] font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_#FF6B35]" />
                Borrador
              </span>
              <span className="font-mono font-bold text-[#FF6B35] ml-auto">
                {draftEvents}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-3 text-xs bg-[#21262D]/40 px-3 py-2 rounded-xl border border-[#30363D]/40">
              <span className="flex items-center gap-2 text-[#F0F6FC] font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E74C3C] shadow-[0_0_8px_#E74C3C]" />
                Cancelados
              </span>
              <span className="font-mono font-bold text-[#E74C3C] ml-auto">
                {cancelledEvents}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Frase-resumen en lenguaje natural con sugerencia accionable */}
      <div className="mt-2 pt-4 border-t border-[#21262D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0D0F14]/40 p-4 rounded-2xl border border-[#30363D]/50">
        <p className="text-xs sm:text-sm text-[#8B949E] leading-snug">
          {draftEvents > 0 ? (
            <>
              <strong className="text-[#F0F6FC]">"{draftEvents} de tus {totalEvents} eventos</strong> están listos para publicarse"
            </>
          ) : totalEvents === 0 ? (
            <span className="text-[#F0F6FC]">"Aún no tienes eventos creados. Da el primer paso hoy."</span>
          ) : (
            <span className="text-[#2ECC71] font-medium">"¡Excelente! Toda tu cartelera activa está publicada y disponible."</span>
          )}
        </p>

        {draftEvents > 0 ? (
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6B35] hover:text-[#FF5A1F] transition-colors shrink-0"
          >
            Revisar borradores
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : totalEvents === 0 ? (
          <Link
            to="/events/new"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF5A1F] hover:underline shrink-0"
          >
            Crear evento
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  )
}
