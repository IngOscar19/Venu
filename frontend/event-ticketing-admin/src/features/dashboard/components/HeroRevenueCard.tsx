import { Link } from 'react-router-dom'
import { TrendingUp, ArrowUpRight, Plus, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface HeroRevenueCardProps {
  revenue: number
  totalTicketsSold: number
  publishedEvents: number
  totalEvents: number
}

export function HeroRevenueCard({
  revenue,
  totalTicketsSold,
  publishedEvents,
  totalEvents,
}: HeroRevenueCardProps) {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'
  const hasRevenue = revenue > 0
  const formattedRevenue = revenue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Subtle progress calculation (based on active events or baseline)
  const activityProgress = totalEvents > 0 
    ? Math.min(Math.max((publishedEvents / totalEvents) * 100, hasRevenue ? 15 : 5), 100) 
    : 0

  return (
    <div className="hero-revenue-card relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1D24] via-[#1E1B22] to-[#201614] border border-[#FF5A1F]/25 p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-[#FF5A1F]/40 group">
      {/* Halo naranja tenue / Glow de marca */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#FF5A1F]/10 blur-3xl transition-all duration-700 group-hover:bg-[#FF5A1F]/15" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#FF6B35]/5 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between gap-6">
        {/* Encabezado de la tarjeta Hero */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5A1F]/15 text-[#FF5A1F] border border-[#FF5A1F]/30 shadow-inner">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <p className="text-xs font-mono font-semibold tracking-wider uppercase text-[#8B949E]">
                Hero métrica
              </p>
              <h2 className="text-base font-bold text-[#F0F6FC] font-headline flex items-center gap-2">
                Ingresos totales
                {hasRevenue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-mono text-[#2ECC71]">
                    <TrendingUp className="h-3 w-3" /> En vivo
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#21262D] px-3 py-1 text-xs font-mono text-[#8B949E] border border-[#30363D]">
              <Sparkles className="h-3.5 w-3.5 text-[#FF5A1F]" />
              Moneda: <strong className="text-[#F0F6FC]">MXN</strong>
            </span>
          </div>
        </div>

        {/* Cifra gigante - Protagonista emocional */}
        <div className="my-2">
          <div className="flex items-baseline flex-wrap gap-2">
            <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#F0F6FC] font-headline tracking-tight drop-shadow-sm">
              ${formattedRevenue}
            </span>
            <span className="text-lg sm:text-xl font-bold text-[#FF5A1F] font-mono">
              MXN
            </span>
          </div>

          {/* Barra sutil de progreso */}
          <div className="mt-4 w-full h-2 rounded-full bg-[#0D0F14]/70 overflow-hidden border border-[#30363D]/60 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF5A1F] via-[#FF6B35] to-[#2ECC71] transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${Math.max(activityProgress, 4)}%` }}
            />
          </div>
        </div>

        {/* Estado vacío o contextual explicado en lenguaje humano */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-[#30363D]/60">
          <p className="text-sm text-[#8B949E] leading-relaxed max-w-2xl">
            {!hasRevenue ? (
              <>
                <span className="text-[#F0F6FC] font-medium">"Aún no se han registrado ventas. </span>
                En cuanto publiques un evento y comience la preventa, verás aquí tu recaudación en tiempo real."
              </>
            ) : (
              <>
                <span className="text-[#2ECC71] font-semibold">"Ventas activas acumuladas. </span>
                {totalTicketsSold} boletos vendidos hasta el momento a través de tu cartelera en tiempo real."
              </>
            )}
          </p>

          <div className="shrink-0 flex items-center gap-2">
            {!isAdmin && publishedEvents === 0 && totalEvents > 0 ? (
              <Link
                to="/events"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6B35] hover:text-[#FF5A1F] transition-colors py-1 px-3 rounded-lg bg-[#FF5A1F]/10 border border-[#FF5A1F]/30"
              >
                Publicar evento
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : !isAdmin && totalEvents === 0 ? (
              <Link
                to="/events/new"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#FF5A1F] hover:bg-[#FF6B35] transition-colors py-1.5 px-3.5 rounded-xl shadow-md"
              >
                <Plus className="h-3.5 w-3.5" />
                Crear primer evento
              </Link>
            ) : (
              <Link
                to="/events"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
              >
                Ver balance detallado
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
