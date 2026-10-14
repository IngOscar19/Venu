import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 segundos para mantener datos frescos
      gcTime: 1000 * 60 * 10, // 10 minutos en memoria
      retry: (failureCount, error: any) => {
        // Don't retry on 401 or 404
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: true, // Actualiza datos en automático cuando el usuario vuelve a la pestaña
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

export default queryClient
