import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { useAuthStore } from '@/store/authStore'
import { Sparkles, UserPlus, LogIn } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const setError = useAuthStore((state) => state.setError)

  const handleSuccess = () => {
    const destination = (location.state as any)?.from?.pathname || '/dashboard'
    navigate(destination, { replace: true })
  }

  const switchMode = (newMode: 'login' | 'register') => {
    setError(null)
    setMode(newMode)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0D1117] p-4 sm:p-6 relative overflow-hidden transition-colors duration-200">
      {/* Theme toggle on top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Decorative background glows with Primary #FA4616 and Secondary #003087 */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FA4616]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#003087]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="relative mb-2 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#FA4616]/20 blur-2xl scale-150 pointer-events-none" />
            <img
              src="/venu-icon-transparent.png"
              alt="Venú Logo"
              className="relative h-16 w-auto object-contain drop-shadow-[0_10px_20px_rgba(250,70,22,0.35)]"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F0F6FC] font-headline tracking-tight">
            Ven<span className="text-[#FA4616]">ú</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#F5A894] mt-1 tracking-wide">
            El lugar donde ocurre
          </p>
          <p className="text-[11px] text-[#8B949E] mt-1.5 flex items-center justify-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#FA4616]" />
            Panel de Administración y Organizadores
          </p>
        </div>

        {/* Card with Stitch surface & border */}
        <div className="bg-[#161B22] rounded-2xl p-6 sm:p-7 shadow-2xl border border-[#30363D]">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-[#0D1117] p-1 border border-[#21262D] mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#FA4616] text-white shadow-md shadow-[#FA4616]/25'
                  : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-[#FA4616] text-white shadow-md shadow-[#FA4616]/25'
                  : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Crear Cuenta
            </button>
          </div>

          <div className="mb-5 text-left">
            <h2 className="text-lg font-bold text-[#F0F6FC] font-headline">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Regístrate como Organizador'}
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5 font-mono">
              {mode === 'login'
                ? 'Ingresa tus credenciales para administrar eventos'
                : 'Crea tu cuenta para publicar y vender boletos'}
            </p>
          </div>

          {mode === 'login' ? (
            <>
              <LoginForm onSuccess={handleSuccess} />

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-xs text-[#8B949E] hover:text-[#FA4616] transition-colors"
                >
                  ¿No tienes una cuenta? <span className="font-semibold text-[#FA4616] underline underline-offset-4">Regístrate como organizador</span>
                </button>
              </div>

              {/* Demo Credentials Hint */}
              <div className="mt-5 pt-4 border-t border-[#21262D] text-center">
                <p className="text-[11px] font-mono text-[#6E7681]">Credenciales demo:</p>
                <p className="text-xs font-mono text-[#8B949E] mt-0.5 select-all">
                  admin@eventticketing.com | Admin123!
                </p>
              </div>
            </>
          ) : (
            <>
              <RegisterForm onSuccess={handleSuccess} />

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs text-[#8B949E] hover:text-[#FA4616] transition-colors"
                >
                  ¿Ya tienes una cuenta? <span className="font-semibold text-[#FA4616] underline underline-offset-4">Inicia sesión aquí</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
