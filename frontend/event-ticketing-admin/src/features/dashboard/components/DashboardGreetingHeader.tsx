import { Search, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

interface DashboardGreetingHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onSearchSubmit?: () => void
}

export function DashboardGreetingHeader({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: DashboardGreetingHeaderProps) {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'

  // Formatear fecha actual en formato legible humano en español:
  // e.g. "lunes 12 de octubre de 2026"
  const now = new Date()
  const formattedDate = now.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Nombre a mostrar (usando el usuario autenticado o 'Martin' por defecto)
  const displayName = user?.firstName || 'Martin'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit()
    }
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
      {/* Saludo personalizado y fecha legible */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F0F6FC] font-headline tracking-tight">
          ¡Hola, <span className="text-[#FF5A1F]">{displayName}</span>!
        </h1>
        <p className="text-sm sm:text-base text-[#8B949E] leading-relaxed">
          Hoy es <strong className="text-[#F0F6FC] capitalize">{formattedDate}</strong>. Aquí tienes el pulso de tu plataforma.
        </p>
      </div>

      {/* Acciones: Buscador en segundo plano visual + Botón de nuevo evento */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Buscador de segundo plano visual */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B949E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar eventos, organizadores..."
            className="h-11 w-full rounded-2xl border border-[#30363D] bg-[#161B22] pl-10 pr-4 text-xs font-mono text-[#F0F6FC] placeholder:text-[#8B949E] focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] focus:outline-none transition-all shadow-sm"
          />
        </div>

        {/* Botón de acción */}
        {!isAdmin && (
          <Link to="/events/new">
            <Button
              variant="default"
              size="default"
              className="w-full sm:w-auto h-11 px-5 rounded-2xl gap-2 font-bold bg-[#FF5A1F] hover:bg-[#FF6B35] text-white shadow-lg transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Crear Evento</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
