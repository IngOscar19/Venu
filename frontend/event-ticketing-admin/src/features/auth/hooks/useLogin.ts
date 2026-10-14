import { useMutation } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { useAuthStore } from '@/store/authStore'
import type { LoginDto } from '@/types/api'

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth)
  const setError = useAuthStore((state) => state.setError)

  return useMutation({
    mutationFn: async (credentials: LoginDto) => {
      setError(null)
      const data = await authService.login(credentials)
      setAuth(data)
      return data
    },
    onError: (err: any) => {
      setError(err.message || 'Error al iniciar sesión.')
    },
  })
}
