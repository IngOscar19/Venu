import { useQuery } from '@tanstack/react-query'
import { eventService } from '../services/eventService'
import { QUERY_KEYS } from '@/constants/queryKeys'

import { useAuthStore } from '@/store/authStore'

export function useMyEvents() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'

  return useQuery({
    queryKey: isAdmin ? QUERY_KEYS.events.all : QUERY_KEYS.events.mine,
    queryFn: () => (isAdmin ? eventService.getAll() : eventService.getMine()),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
}

export function useEventDetail(id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.events.detail(id || ''),
    queryFn: () => eventService.getById(id!),
    enabled: Boolean(id),
  })
}

export function useEventTypes() {
  return useQuery({
    queryKey: QUERY_KEYS.eventTypes.all,
    queryFn: () => eventService.getEventTypes(),
  })
}
