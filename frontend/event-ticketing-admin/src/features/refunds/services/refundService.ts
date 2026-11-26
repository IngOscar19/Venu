import apiClient from '@/lib/axios'
import type { EventRefundSummaryDto, RefundItemAdminDto } from '@/types/api'

export const refundService = {
  getAll: async (params?: { eventId?: string; status?: string }) => {
    const res = await apiClient.get<RefundItemAdminDto[]>('/api/refunds', { params })
    return res.data
  },

  getEventSummary: async (eventId: string) => {
    const res = await apiClient.get<EventRefundSummaryDto>(`/api/refunds/events/${eventId}/summary`)
    return res.data
  },

  approve: async (id: string, notes?: string) => {
    const res = await apiClient.post<{ exito: boolean; message: string; refundId: string }>(
      `/api/refunds/${id}/approve`,
      { notes }
    )
    return res.data
  },

  reject: async (id: string, notes?: string) => {
    const res = await apiClient.post<{ exito: boolean; message: string; refundId: string }>(
      `/api/refunds/${id}/reject`,
      { notes }
    )
    return res.data
  },

  directRefundTicket: async (ticketId: string, notes?: string) => {
    const res = await apiClient.post<{ exito: boolean; message: string; refundId: string }>(
      `/api/refunds/tickets/${ticketId}/direct-refund`,
      { notes }
    )
    return res.data
  },

  refundAllForEvent: async (eventId: string, onlyRequested: boolean) => {
    const res = await apiClient.post<{
      exito: boolean
      processedCount: number
      totalRefunded: number
      message: string
    }>(`/api/refunds/events/${eventId}/refund-all`, { onlyRequested })
    return res.data
  },
}
