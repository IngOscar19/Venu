import apiClient from '@/lib/axios'
import type { AuthResponseDto, LoginDto, RegisterDto, UserProfileDto } from '@/types/api'

export const authService = {
  login: async (credentials: LoginDto): Promise<AuthResponseDto> => {
    const res = await apiClient.post<AuthResponseDto>('/api/auth/login', credentials)
    return res.data
  },

  register: async (data: RegisterDto): Promise<AuthResponseDto> => {
    const res = await apiClient.post<AuthResponseDto>('/api/auth/register', data)
    return res.data
  },

  getProfile: async (): Promise<UserProfileDto> => {
    const res = await apiClient.get<UserProfileDto>('/api/auth/me')
    return res.data
  },
}
