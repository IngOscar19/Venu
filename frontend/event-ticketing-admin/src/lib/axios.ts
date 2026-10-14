import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorResponse } from '@/types/api'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5272'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle 401 & format errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Avoid redirect loops if already on login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : '') ||
      error.message ||
      'Ha ocurrido un error inesperado.'

    return Promise.reject(new Error(errorMessage))
  }
)

export default apiClient
