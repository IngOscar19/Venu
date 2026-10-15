import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 segundos
      gcTime: 1000 * 60 * 10, // 10 minutos en memoria
      retry: (failureCount, error: any) => {
        // Don't retry on 401 or 404
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          return false
        }
        return failureCount < 2
      },
      // 🔄 Auto-actualización continua de datos sin necesidad de dar F5:
      refetchInterval: 1000 * 20, // Consulta automática cada 20 segundos
      refetchIntervalInBackground: false, // Pausa cuando la pestaña está minimizada para ahorrar recursos
      refetchOnWindowFocus: true, // Actualiza datos de inmediato al regresar a la pestaña
      refetchOnReconnect: true, // Actualiza datos al recuperar la conexión
    },
    mutations: {
      retry: 0,
    },
  },
})

export default queryClient
