import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/features/auth/services/authService'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { VerificationLevel } from '@/types/api'
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Building2,
  Calendar,
  Key,
  Copy,
  Check,
  LogOut,
  ExternalLink,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  Layers,
  Info,
  ChevronRight,
  CheckCircle,
} from 'lucide-react'

// Helper to reliably parse VerificationLevel from backend (string or numeric)
function parseVerificationLevel(rawLevel: any, status?: string): VerificationLevel {
  if (rawLevel === 3 || rawLevel === '3' || String(rawLevel).toLowerCase() === 'enterprise') return 'Enterprise'
  if (rawLevel === 2 || rawLevel === '2' || String(rawLevel).toLowerCase() === 'pro') return 'Pro'
  if (rawLevel === 1 || rawLevel === '1' || String(rawLevel).toLowerCase() === 'basic') return 'Basic'
  if (rawLevel === 0 || rawLevel === '0' || String(rawLevel).toLowerCase() === 'unverified') return 'Unverified'
  // If status is VERIFIED but level wasn't provided, default to Basic
  if (status === 'VERIFIED') return 'Basic'
  return 'Unverified'
}

interface LevelDetails {
  key: VerificationLevel
  tier: string
  name: string
  badgeText: string
  badgeColor: string
  cardBorder: string
  maxCapacity: number
  maxCapacityLabel: string
  maxEvents: number
  maxEventsLabel: string
  description: string
  perks: string[]
}

const VERIFICATION_LEVELS_INFO: Record<VerificationLevel, LevelDetails> = {
  Unverified: {
    key: 'Unverified',
    tier: 'Nivel 0',
    name: 'Sin Verificar',
    badgeText: 'Nivel 0 · Sin Verificar',
    badgeColor: 'text-[#8B949E] bg-[#21262D] border-[#30363D]',
    cardBorder: 'border-[#30363D]',
    maxCapacity: 0,
    maxCapacityLabel: '0 personas (Solo borradores)',
    maxEvents: 0,
    maxEventsLabel: '0 eventos activos',
    description: 'Cuenta registrada sin verificación de identidad. Puedes crear borradores pero no puedes publicar eventos ni vender entradas.',
    perks: ['Creación ilimitada de borradores', 'Configuración de mapas y aforos'],
  },
  Basic: {
    key: 'Basic',
    tier: 'Tier 1',
    name: 'Básico (Tier 1)',
    badgeText: 'Nivel Básico · Hasta 500 personas',
    badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
    cardBorder: 'border-blue-800/50',
    maxCapacity: 500,
    maxCapacityLabel: 'Hasta 500 personas por evento',
    maxEvents: 3,
    maxEventsLabel: 'Hasta 3 eventos publicados simultáneamente',
    description: 'Verificación estándar con identificación oficial, RFC/CURP y cuenta bancaria CLABE aprobada por el equipo de Venú.',
    perks: ['Aforo de hasta 500 asistentes por evento', 'Hasta 3 eventos activos en cartelera', 'Cobros directos con dispersión segura'],
  },
  Pro: {
    key: 'Pro',
    tier: 'Tier 2',
    name: 'Profesional (Tier 2)',
    badgeText: 'Nivel Pro · Hasta 5,000 personas',
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    cardBorder: 'border-amber-800/50',
    maxCapacity: 5000,
    maxCapacityLabel: 'Hasta 5,000 personas por evento',
    maxEvents: 10,
    maxEventsLabel: 'Hasta 10 eventos publicados simultáneamente',
    description: 'Para organizadores o empresas consolidadas con historial verificado de 3 o más eventos exitosos y sin incidencias.',
    perks: ['Aforo de hasta 5,000 asistentes por evento', 'Hasta 10 eventos activos en cartelera', 'Soporte prioritario y visibilidad destacada'],
  },
  Enterprise: {
    key: 'Enterprise',
    tier: 'Tier 3',
    name: 'Enterprise (Tier 3)',
    badgeText: 'Nivel Enterprise · Capacidad Ilimitada',
    badgeColor: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
    cardBorder: 'border-purple-800/50',
    maxCapacity: Infinity,
    maxCapacityLabel: 'Capacidad Ilimitada (Sin tope)',
    maxEvents: Infinity,
    maxEventsLabel: 'Eventos ilimitados simultáneos',
    description: 'Acuerdo empresarial y corporativo directo con Venú para grandes festivales, arenas y promotoras de alto volumen.',
    perks: ['Aforo masivo sin tope de capacidad', 'Eventos ilimitados en cartelera', 'Ejecutivo de cuenta dedicado y SLA garantizado'],
  },
}

export function AccountPage() {
  const navigate = useNavigate()
  const localUser = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Fetch fresh profile data from /api/auth/me
  const { data: profile, isLoading } = useQuery({
    queryKey: QUERY_KEYS.auth.me,
    queryFn: () => authService.getProfile(),
    staleTime: 60_000,
    retry: 1,
  })

  // Use profile data from API or fallback to localStorage user
  const user = profile || localUser
  const isAdmin = user?.role === 'ADMIN'
  const organizer = profile?.organizer

  const currentLevelKey = parseVerificationLevel(
    organizer?.verificationLevel || (organizer as any)?.VerificationLevel,
    organizer?.status || localUser?.organizerStatus
  )
  const currentLevel = VERIFICATION_LEVELS_INFO[currentLevelKey]

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Fecha no disponible'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getVerificationMeta = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return {
          label: 'Verificado',
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-800/60',
          icon: CheckCircle2,
        }
      case 'PENDING':
        return {
          label: 'En Revisión',
          color: 'text-amber-400',
          bg: 'bg-amber-950/40',
          border: 'border-amber-800/60',
          icon: Clock,
        }
      case 'REJECTED':
        return {
          label: 'Rechazado',
          color: 'text-rose-400',
          bg: 'bg-rose-950/40',
          border: 'border-rose-800/60',
          icon: AlertCircle,
        }
      default:
        return {
          label: 'Sin Verificar',
          color: 'text-[#8B949E]',
          bg: 'bg-[#21262D]',
          border: 'border-[#30363D]',
          icon: Shield,
        }
    }
  }

  const verificationMeta = getVerificationMeta(organizer?.status || localUser?.organizerStatus)
  const StatusIcon = verificationMeta.icon

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full min-w-0 overflow-x-hidden pb-16 animate-in fade-in-50 duration-300">
      <PageHeader
        title="Mi Cuenta"
        description="Consulta tus datos de perfil, nivel de verificación, aforo máximo y límites de tu cuenta"
      >
        <Button
          variant="outlined"
          size="sm"
          onClick={handleLogout}
          className="gap-2 border-rose-800/50 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </Button>
      </PageHeader>

      {/* Hero Profile Banner */}
      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-3xl" />
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161B22] via-[#1A1D24] to-[#21262D] border border-[#30363D] p-6 sm:p-8 shadow-xl">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FA4616]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              {/* Avatar circle */}
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-[#0D1117] border-2 border-[#FA4616]/50 text-[#FA4616] text-xl sm:text-2xl font-black font-headline shadow-lg shadow-[#FA4616]/10">
                {user?.firstName?.[0] || 'U'}
                {user?.lastName?.[0] || ''}
              </div>

              {/* Name & identifiers */}
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F0F6FC] font-headline truncate">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <span className="rounded-lg bg-[#FA4616]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#FA4616] border border-[#FA4616]/30">
                    {user?.role || 'ORGANIZADOR'}
                  </span>
                  {!isAdmin && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold ${currentLevel.badgeColor} border`}
                    >
                      <Award className="h-3 w-3" />
                      {currentLevel.tier} · {currentLevel.name}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#8B949E] flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-[#6E7681] shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </p>

                {profile?.createdAt && (
                  <p className="text-[11px] font-mono text-[#8B949E] flex items-center gap-1 pt-0.5">
                    <Calendar className="h-3 w-3 text-[#FA4616] shrink-0" />
                    <span>Miembro desde {formatDate(profile.createdAt)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick action button */}
            <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
              {!isAdmin ? (
                <Link to="/verification" className="w-full sm:w-auto">
                  <Button variant="default" size="sm" className="w-full sm:w-auto gap-2 font-bold shadow-md">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Gestionar Verificación</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/admin/organizers" className="w-full sm:w-auto">
                  <Button variant="default" size="sm" className="w-full sm:w-auto gap-2 font-bold shadow-md">
                    <Building2 className="h-4 w-4" />
                    <span>Panel de Administrador</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN DESTACADA: Nivel de Verificación y Límites de la Cuenta */}
      {!isAdmin && (
        <div className="rounded-3xl bg-[#161B22] border border-[#30363D] p-6 sm:p-7 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#21262D]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h3 className="text-base font-bold text-[#F0F6FC] font-headline">
                  Nivel de Verificación y Límites de Cuenta
                </h3>
              </div>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Capacidad máxima permitida para organizar eventos y cuota de publicaciones activas simultáneas
              </p>
            </div>

            <Link
              to="/verification"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#FA4616] hover:underline shrink-0"
            >
              <span>Subir de Nivel</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 3 Tarjetas de métricas de límites de la cuenta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Nivel de Verificado */}
            <div className="rounded-2xl bg-[#0D1117] border border-[#30363D] p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">
                  Nivel Asignado
                </span>
                <div className="h-8 w-8 rounded-xl bg-[#21262D] flex items-center justify-center text-[#FA4616]">
                  <Award className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-[#F0F6FC] font-headline">
                  {currentLevel.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <StatusIcon className={`h-3 w-3 ${verificationMeta.color}`} />
                  <span className={`text-xs font-mono font-bold ${verificationMeta.color}`}>
                    {verificationMeta.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Capacidad Máxima de Aforo */}
            <div className="rounded-2xl bg-[#0D1117] border border-[#30363D] p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">
                  Aforo Máximo por Evento
                </span>
                <div className="h-8 w-8 rounded-xl bg-[#21262D] flex items-center justify-center text-[#2ECC71]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-[#F0F6FC] font-headline">
                  {currentLevel.maxCapacity === Infinity
                    ? 'Sin límite'
                    : currentLevel.maxCapacity === 0
                    ? '0 personas'
                    : `${currentLevel.maxCapacity.toLocaleString()} personas`}
                </p>
                <p className="text-xs text-[#8B949E] mt-0.5">
                  {currentLevel.maxCapacity === 0
                    ? 'Solo permite guardar borradores'
                    : 'Tope máximo de boletos por evento'}
                </p>
              </div>
            </div>

            {/* 3. Límite de Eventos Activos Simultáneos */}
            <div className="rounded-2xl bg-[#0D1117] border border-[#30363D] p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">
                  Límite de la Cuenta
                </span>
                <div className="h-8 w-8 rounded-xl bg-[#21262D] flex items-center justify-center text-[#8DA4EF]">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-[#F0F6FC] font-headline">
                  {currentLevel.maxEvents === Infinity
                    ? 'Ilimitados'
                    : currentLevel.maxEvents === 0
                    ? '0 en vivo'
                    : `Hasta ${currentLevel.maxEvents} activos`}
                </p>
                <p className="text-xs text-[#8B949E] mt-0.5">
                  {currentLevel.maxEvents === 0
                    ? 'Requiere verificación para publicar'
                    : 'Eventos simultáneos en cartelera'}
                </p>
              </div>
            </div>
          </div>

          {/* Estado contextual / Alerta explicativa según nivel */}
          {currentLevelKey === 'Unverified' && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">Tu cuenta aún no está verificada</p>
                  <p className="text-amber-200/90 mt-0.5 leading-relaxed">
                    Puedes diseñar eventos y secciones en modo borrador, pero para publicar y comenzar a vender boletos necesitas validar tu identidad y datos fiscales.
                  </p>
                </div>
              </div>
              <Link to="/verification" className="shrink-0 w-full sm:w-auto">
                <Button variant="default" size="sm" className="w-full sm:w-auto font-bold bg-amber-500 hover:bg-amber-600 text-black">
                  Iniciar Verificación
                </Button>
              </Link>
            </div>
          )}

          {currentLevelKey === 'Basic' && (
            <div className="p-4 rounded-2xl bg-[#0D1117] border border-[#21262D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#8B949E]">
              <div className="flex items-start gap-2.5">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#F0F6FC]">¿Necesitas más aforo o más eventos simultáneos?</p>
                  <p className="mt-0.5 leading-relaxed">
                    Al completar 3 o más eventos exitosos puedes solicitar tu ascenso al <strong>Nivel Pro (Tier 2)</strong> para organizar eventos de hasta 5,000 personas y 10 eventos simultáneos.
                  </p>
                </div>
              </div>
              <Link to="/verification" className="shrink-0 w-full sm:w-auto">
                <Button variant="outlined" size="sm" className="w-full sm:w-auto text-xs">
                  Ver Requisitos Pro
                </Button>
              </Link>
            </div>
          )}

          {/* Comparativa Visual de los 3 Niveles de Venú */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-mono font-medium uppercase tracking-wider text-[#8B949E]">
              Escalafón de Niveles en Venú
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['Basic', 'Pro', 'Enterprise'] as const).map((levelKey) => {
                const info = VERIFICATION_LEVELS_INFO[levelKey]
                const isCurrent = currentLevelKey === levelKey

                return (
                  <div
                    key={levelKey}
                    className={`rounded-2xl p-4 transition-all relative ${
                      isCurrent
                        ? 'bg-[#1A1D24] border-2 border-[#FA4616] shadow-md shadow-[#FA4616]/10'
                        : 'bg-[#0D1117] border border-[#21262D] opacity-80'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2.5 right-3 bg-[#FA4616] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                        Tu Nivel Actual
                      </span>
                    )}

                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#21262D]">
                      <span className="text-xs font-bold text-[#F0F6FC] font-headline">{info.name}</span>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${info.badgeColor} border`}>
                        {info.tier}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-[#8B949E] uppercase block">Aforo Máximo</span>
                        <span className="font-bold text-[#F0F6FC]">{info.maxCapacityLabel}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8B949E] uppercase block">Eventos Simultáneos</span>
                        <span className="font-bold text-[#F0F6FC]">{info.maxEventsLabel}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Datos Personales y de Organización */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Información Personal */}
          <div className="rounded-2xl bg-[#161B22] border border-[#30363D] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#21262D]">
              <h3 className="text-sm font-bold text-[#F0F6FC] font-headline flex items-center gap-2">
                <User className="h-4 w-4 text-[#FA4616]" />
                <span>Información Personal</span>
              </h3>
              <span className="text-[10px] font-mono uppercase text-[#8B949E]">Datos de Usuario</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                <p className="text-[10px] font-mono text-[#8B949E] uppercase">Nombre</p>
                <p className="font-semibold text-[#F0F6FC]">{user?.firstName || '—'}</p>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                <p className="text-[10px] font-mono text-[#8B949E] uppercase">Apellido</p>
                <p className="font-semibold text-[#F0F6FC]">{user?.lastName || '—'}</p>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D] sm:col-span-2">
                <p className="text-[10px] font-mono text-[#8B949E] uppercase">Correo Electrónico</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#F0F6FC] truncate">{user?.email || '—'}</p>
                  <button
                    onClick={() => handleCopy(user?.email || '', 'email')}
                    className="p-1 rounded text-[#8B949E] hover:text-[#FA4616] hover:bg-[#21262D] transition-colors shrink-0"
                    title="Copiar correo"
                  >
                    {copiedKey === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                <p className="text-[10px] font-mono text-[#8B949E] uppercase">Rol en Plataforma</p>
                <p className="font-semibold text-[#FA4616] font-mono">{user?.role || 'ORGANIZADOR'}</p>
              </div>

              <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                <p className="text-[10px] font-mono text-[#8B949E] uppercase">Estado de Cuenta</p>
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Activa y Operativa
                </p>
              </div>
            </div>
          </div>

          {/* Card: Perfil de Organizador */}
          {!isAdmin && (
            <div className="rounded-2xl bg-[#161B22] border border-[#30363D] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#21262D]">
                <h3 className="text-sm font-bold text-[#F0F6FC] font-headline flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#FF6B35]" />
                  <span>Perfil de Organizador</span>
                </h3>
                <Link
                  to="/verification"
                  className="text-xs font-mono font-medium text-[#FA4616] hover:underline flex items-center gap-1"
                >
                  <span>Verificar</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase">Nombre Comercial / Organización</p>
                    <p className="font-semibold text-[#F0F6FC]">
                      {organizer?.name || `${user?.firstName} ${user?.lastName}`}
                    </p>
                  </div>

                  <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase">Estado de Verificación</p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <StatusIcon className={`h-3.5 w-3.5 ${verificationMeta.color}`} />
                      <span className={`font-bold font-mono ${verificationMeta.color}`}>
                        {verificationMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase">Nivel de Verificado</p>
                    <p className="font-bold text-[#F0F6FC] font-headline flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-[#FA4616]" />
                      {currentLevel.name}
                    </p>
                  </div>

                  <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase">Aforo Máximo Permitido</p>
                    <p className="font-bold text-[#2ECC71] font-mono">
                      {currentLevel.maxCapacityLabel}
                    </p>
                  </div>
                </div>

                {organizer?.description && (
                  <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase">Descripción del Organizador</p>
                    <p className="text-[#8B949E] leading-relaxed">{organizer.description}</p>
                  </div>
                )}

                {organizer?.id && (
                  <div className="space-y-1 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase">ID de Organizador</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono text-[11px] text-[#F0F6FC] truncate">{organizer.id}</code>
                      <button
                        onClick={() => handleCopy(organizer.id, 'orgId')}
                        className="p-1 rounded text-[#8B949E] hover:text-[#FA4616] hover:bg-[#21262D] transition-colors shrink-0"
                        title="Copiar ID"
                      >
                        {copiedKey === 'orgId' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Seguridad y Atajos */}
        <div className="space-y-6">
          {/* Card: Seguridad y Sesión */}
          <div className="rounded-2xl bg-[#161B22] border border-[#30363D] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#21262D]">
              <h3 className="text-sm font-bold text-[#F0F6FC] font-headline flex items-center gap-2">
                <Key className="h-4 w-4 text-[#FA4616]" />
                <span>Seguridad y Sesión</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0D1117] border border-[#21262D] space-y-1">
                <p className="text-[10px] font-mono text-[#8B949E] uppercase">ID Único de Usuario</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-[11px] text-[#8DA4EF] truncate">
                    {profile?.id || localUser?.userId || '—'}
                  </code>
                  <button
                    onClick={() => handleCopy(String(profile?.id || localUser?.userId || ''), 'userId')}
                    className="p-1 rounded text-[#8B949E] hover:text-[#FA4616] hover:bg-[#21262D] transition-colors shrink-0"
                    title="Copiar ID"
                  >
                    {copiedKey === 'userId' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0D1117] border border-[#21262D] space-y-1">
                <p className="text-[10px] font-mono text-[#8B949E] uppercase">Token JWT de Autenticación</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-[11px] text-[#8B949E] truncate">
                    {token ? `${token.substring(0, 16)}...${token.substring(token.length - 8)}` : 'No disponible'}
                  </code>
                  {token && (
                    <button
                      onClick={() => handleCopy(token, 'token')}
                      className="p-1 rounded text-[#8B949E] hover:text-[#FA4616] hover:bg-[#21262D] transition-colors shrink-0"
                      title="Copiar Token"
                    >
                      {copiedKey === 'token' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outlined"
                  onClick={handleLogout}
                  className="w-full justify-center gap-2 text-xs font-semibold border-rose-900/40 text-rose-400 hover:bg-rose-950/30 hover:border-rose-800"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Cerrar Sesión Activa</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Card: Accesos Rápidos */}
          <div className="rounded-2xl bg-[#161B22] border border-[#30363D] p-5 sm:p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#F0F6FC] font-headline flex items-center gap-2 pb-2 border-b border-[#21262D]">
              <Sparkles className="h-4 w-4 text-[#FA4616]" />
              <span>Accesos Rápidos</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              <Link
                to="/dashboard"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] transition-colors group"
              >
                <span>Panel Principal (Dashboard)</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#6E7681] group-hover:text-[#FA4616] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/events"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] transition-colors group"
              >
                <span>{isAdmin ? 'Todos los Eventos' : 'Mis Eventos'}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#6E7681] group-hover:text-[#FA4616] group-hover:translate-x-0.5 transition-all" />
              </Link>

              {!isAdmin ? (
                <Link
                  to="/events/new"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] transition-colors group"
                >
                  <span>Crear Nuevo Evento</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#6E7681] group-hover:text-[#FA4616] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ) : (
                <Link
                  to="/admin/verifications"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] transition-colors group"
                >
                  <span>Solicitudes de Verificación</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#6E7681] group-hover:text-[#FA4616] group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage
