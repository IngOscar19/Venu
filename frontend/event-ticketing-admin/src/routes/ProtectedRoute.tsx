import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/features/auth/services/authService'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)
  const isChecking = useAuthStore((state) => state.isChecking)
  const setAuth = useAuthStore((state) => state.setAuth)
  const setChecking = useAuthStore((state) => state.setChecking)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    async function verify() {
      if (!token) {
        setChecking(false)
        return
      }

      try {
        const profile = await authService.getProfile()
        if (isMounted) {
          const storedUser = localStorage.getItem('user')
          const parsed = storedUser ? JSON.parse(storedUser) : {}
          setAuth({
            token,
            userId: profile.id,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.role,
            organizerId: profile.organizer?.id || parsed.organizerId,
          })
        }
      } catch {
        if (isMounted) {
          logout()
        }
      }
    }

    if (isChecking) {
      verify()
    }

    return () => {
      isMounted = false
    }
  }, [token, isChecking, setAuth, setChecking, logout])

  if (isChecking && token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#002244]/5">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#FB4F14]" />
          <p className="text-sm font-medium text-slate-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
