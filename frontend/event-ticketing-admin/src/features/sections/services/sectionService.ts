import apiClient from '@/lib/axios'
import type { EventSectionDto, CreateEventSectionDto } from '@/types/api'

export const sectionService = {
  create: async (eventId: string, data: CreateEventSectionDto): Promise<EventSectionDto> => {
    const res = await apiClient.post<EventSectionDto>(`/api/events/${eventId}/sections`, data)
    return res.data
  },

  update: async (eventId: string, sectionId: string, data: CreateEventSectionDto): Promise<EventSectionDto> => {
    const res = await apiClient.put<EventSectionDto>(`/api/events/${eventId}/sections/${sectionId}`, data)
    return res.data
  },

  delete: async (eventId: string, sectionId: string): Promise<void> => {
    await apiClient.delete(`/api/events/${eventId}/sections/${sectionId}`)
  },
}
