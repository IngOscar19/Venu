import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '@/features/dashboard/services/dashboardService'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  DashboardGreetingHeader,
  HeroRevenueCard,
  SecondaryMetricsRow,
  BillboardDonutSummary,
  UpcomingTimeline,
  RecentEventsCardsList,
} from '@/features/dashboard/components'

export function DashboardPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: stats, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dashboard.stats,
    queryFn: () => dashboardService.getStats(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 w-full min-w-0 overflow-x-hidden animate-in fade-in-50 duration-300">
      {/* 1. Barra superior: Saludo personalizado + fecha legible + buscador */}
      <DashboardGreetingHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* 2. HERO: Ingresos totales (protagonista) */}
      {isLoading ? (
        <Skeleton className="h-64 sm:h-72 w-full rounded-3xl" />
      ) : (
        <HeroRevenueCard
          revenue={stats?.totalRevenue ?? 0}
          totalTicketsSold={stats?.totalTicketsSold ?? 0}
          publishedEvents={stats?.publishedEvents ?? 0}
          totalEvents={stats?.totalEvents ?? 0}
        />
      )}

      {/* 3. Métricas secundarias: fila compacta de 3 columnas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl w-full" />
          ))}
        </div>
      ) : (
        <SecondaryMetricsRow
          totalTicketsSold={stats?.totalTicketsSold ?? 0}
          totalEvents={stats?.totalEvents ?? 0}
          publishedEvents={stats?.publishedEvents ?? 0}
          draftEvents={stats?.draftEvents ?? 0}
          cancelledEvents={stats?.cancelledEvents ?? 0}
        />
      )}

      {/* 4. Resumen visual: Anillo de progreso + Línea de tiempo de próximos eventos */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-3xl w-full" />
          <Skeleton className="h-80 rounded-3xl w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BillboardDonutSummary
            totalEvents={stats?.totalEvents ?? 0}
            publishedEvents={stats?.publishedEvents ?? 0}
            draftEvents={stats?.draftEvents ?? 0}
            cancelledEvents={stats?.cancelledEvents ?? 0}
          />
          <UpcomingTimeline events={stats?.recentEvents} />
        </div>
      )}

      {/* 5. Eventos recientes: De tabla fría a tarjetas horizontales humanas */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-xl font-bold text-[#F0F6FC] font-headline flex items-center gap-2">
              <span>🎯</span>
              <span>Eventos Recientes</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#8B949E] mt-0.5">
              Tarjetas visuales con estado en color, recaudación y avance de boletos en tiempo real
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl w-full" />
            ))}
          </div>
        ) : (
          <RecentEventsCardsList
            events={stats?.recentEvents}
            searchFilter={searchQuery}
          />
        )}
      </div>
    </div>
  )
}

export default DashboardPage
