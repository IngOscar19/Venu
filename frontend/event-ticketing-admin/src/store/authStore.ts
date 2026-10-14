import { create } from 'zustand'
import type { AuthResponseDto } from '@/types/api'

interface AuthState {
  token: string | null
  user: AuthResponseDto | null
  isLoading: boolean
  isChecking: boolean
  error: string | null
  setAuth: (data: AuthResponseDto) => void
  logout: () => void
  setError: (error: string | null) => void
  setChecking: (isChecking: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user:
    typeof window !== 'undefined' && localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user')!)
      : null,
  isLoading: false,
  isChecking: true,
  error: null,

  setAuth: (data: AuthResponseDto) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    set({
      token: data.token,
      user: data,
      error: null,
      isChecking: false,
    })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({
      token: null,
      user: null,
      error: null,
      isChecking: false,
    })
  },

  setError: (error) => set({ error }),
  setChecking: (isChecking) => set({ isChecking }),
}))
