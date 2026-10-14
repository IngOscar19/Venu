import apiClient from '@/lib/axios'
import type { DashboardStatsDto } from '@/types/api'

export const dashboardService = {
  getStats: async (): Promise<DashboardStatsDto> => {
    const res = await apiClient.get<DashboardStatsDto>('/api/dashboard/stats')
    return res.data
  },
}
