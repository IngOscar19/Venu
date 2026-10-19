import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  User as UserIcon,
  ShieldCheck,
  Shield,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { cn } from '@/lib/utils'

export function Header() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'ADMIN'

  // Close menus on route navigation
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserDropdownOpen(false)
  }, [location.pathname])

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      to: '/events',
      label: isAdmin ? 'Todos los Eventos' : 'Mis Eventos',
      icon: Calendar,
      end: true,
    },
    ...(isAdmin
      ? [
          { to: '/admin/organizers', label: 'Organizadores', icon: Users },
          { to: '/admin/verifications', label: 'Verificaciones', icon: ShieldCheck },
        ]
      : []),
  ]

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 w-full items-center justify-between border-b border-[#21262D] bg-[#161B22]/95 px-4 sm:px-6 backdrop-blur-md transition-colors duration-200">
      {/* Left: Brand + Desktop Nav */}
      <div className="flex items-center gap-6 lg:gap-8">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D1117] p-1.5 border border-[#30363D] shadow-sm group-hover:border-[#FA4616] transition-colors">
            <img src="/venu-icon-transparent.png" alt="Venú" className="h-full w-full object-contain filter drop-shadow" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-[#F0F6FC] font-headline">
              Ven<span className="text-[#FA4616]">ú</span>
            </span>
            <span className="rounded bg-[#FA4616]/15 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-[#FA4616]">
              {isAdmin ? 'ADMIN' : 'ORGANIZADOR'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[#FA4616]/15 text-[#FA4616] font-semibold border border-[#FA4616]/30 shadow-sm'
                      : 'text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC]'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Right: Actions, Theme, User Menu */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#21262D] transition-colors border border-transparent hover:border-[#30363D]"
            aria-expanded={userDropdownOpen}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#21262D] border border-[#30363D] text-[#FA4616] text-xs font-bold font-mono shadow-sm">
              {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <p className="text-xs font-semibold text-[#F0F6FC] leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] font-mono text-[#8B949E] mt-0.5">
                {isAdmin ? 'Administrador' : 'Organizador'}
              </p>
            </div>
            <ChevronDown className={cn('h-3.5 w-3.5 text-[#8B949E] transition-transform duration-200 hidden sm:block', userDropdownOpen && 'rotate-180')} />
          </button>

          {/* User Popover Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#30363D] bg-[#161B22] p-2 shadow-2xl backdrop-blur-md z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#21262D] mb-1">
                <p className="text-xs font-bold text-[#F0F6FC] truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] font-mono text-[#8B949E] truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-1.5 rounded bg-[#FA4616]/15 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-[#FA4616]">
                  {isAdmin ? 'ADMINISTRADOR' : 'ORGANIZADOR'}
                </span>
              </div>

              <div className="space-y-1">
                <Link
                  to="/account"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-[#8B949E]" />
                  <span>Mi Cuenta</span>
                </Link>

                {!isAdmin && (
                  <Link
                    to="/verification"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#F0F6FC] hover:bg-[#21262D] transition-colors"
                  >
                    <Shield className="h-4 w-4 text-[#FA4616]" />
                    <span>Verificación de Identidad</span>
                  </Link>
                )}

                <div className="border-t border-[#21262D] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC] md:hidden"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 border-b border-[#21262D] bg-[#161B22] p-4 shadow-2xl md:hidden z-40 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-[#FA4616] text-white font-semibold'
                        : 'text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC]'
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}

            <NavLink
              to="/account"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-[#FA4616] text-white font-semibold'
                    : 'text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC]'
                )
              }
            >
              <UserIcon className="h-4 w-4" />
              <span>Mi Cuenta</span>
            </NavLink>

            {!isAdmin && (
              <NavLink
                to="/verification"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-[#FA4616] text-white font-semibold'
                      : 'text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC]'
                  )
                }
              >
                <Shield className="h-4 w-4" />
                <span>Verificación</span>
              </NavLink>
            )}
          </nav>

          <div className="pt-2 border-t border-[#21262D]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                logout()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D1117] border border-[#30363D] px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
