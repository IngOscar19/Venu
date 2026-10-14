import { useMutation } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { useAuthStore } from '@/store/authStore'
import type { RegisterDto } from '@/types/api'

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth)
  const setError = useAuthStore((state) => state.setError)

  return useMutation({
    mutationFn: async (data: RegisterDto) => {
      setError(null)
      const res = await authService.register(data)
      setAuth(res)
      return res
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear la cuenta de organizador.')
    },
  })
}
