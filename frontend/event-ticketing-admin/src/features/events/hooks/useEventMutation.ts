import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eventService } from '../services/eventService'
import { QUERY_KEYS } from '@/constants/queryKeys'

export function useEventMutations() {
  const queryClient = useQueryClient()

  const publishMutation = useMutation({
    mutationFn: (id: string) => eventService.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => eventService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
    },
  })

  return {
    publishMutation,
    cancelMutation,
    deleteMutation,
  }
}
