import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, PlusCircle, LogOut, ShieldCheck, Shield, Users, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const isAdmin = user?.role === 'ADMIN'

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      to: '/events',
      label: isAdmin ? 'Todos los Eventos' : 'Mis Eventos',
      icon: Calendar,
      end: true,
    },
    ...(!isAdmin
      ? [
          { to: '/events/new', label: 'Crear Evento', icon: PlusCircle },
          { to: '/verification', label: 'Verificación', icon: Shield },
        ]
      : []),
  ]

  const adminItems = [
    { to: '/admin/organizers', label: 'Organizadores', icon: Users },
    { to: '/admin/verifications', label: 'Verificaciones', icon: ShieldCheck },
  ]

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-[#161B22] text-[#F0F6FC] border-r border-[#21262D] transition-transform duration-300 ease-in-out lg:static lg:h-full lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-[#21262D]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D1117] p-1.5 border border-[#30363D] shadow-md shadow-[#FA4616]/10">
              <img src="/venu-icon-transparent.png" alt="Venú" className="h-full w-full object-contain filter drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-[#F0F6FC] font-headline">
                  Ven<span className="text-[#FA4616]">ú</span>
                </span>
                <span className="rounded bg-[#FA4616]/15 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-[#FA4616]">
                  {isAdmin ? 'ADMIN' : 'ORGANIZER'}
                </span>
              </div>
              <span className="block text-[10px] text-[#8B949E] font-medium tracking-tight">
                El lugar donde ocurre
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#8B949E] hover:bg-[#21262D] hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Nav principal */}
          <div>
            <p className="px-3 text-[10px] font-mono font-medium uppercase tracking-wider text-[#8B949E] mb-3">
              Navegación
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-150',
                        isActive
                          ? 'bg-[#FA4616] text-white font-semibold shadow-md shadow-[#FA4616]/20'
                          : 'text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC]'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Sección Admin — solo si es ADMIN */}
          {isAdmin && (
            <div>
              <p className="px-3 text-[10px] font-mono font-medium uppercase tracking-wider text-[#8B949E] mb-3">
                Administración
              </p>
              <nav className="space-y-1">
                {adminItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-150',
                          isActive
                            ? 'bg-[#003087] text-white font-semibold shadow-md shadow-[#003087]/30'
                            : 'text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC]'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="shrink-0 p-4 border-t border-[#21262D] bg-[#0D1117]">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#21262D] text-[#F5A894] font-bold text-xs border border-[#30363D]">
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#F0F6FC]">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-[#FA4616]" />
                <span className="truncate text-[10px] font-mono text-[#8B949E]">
                  {user?.role || 'ORGANIZADOR'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#161B22] border border-[#30363D] px-3 py-2 text-xs font-medium text-[#8B949E] hover:bg-rose-950/30 hover:text-rose-400 hover:border-rose-900/40 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
