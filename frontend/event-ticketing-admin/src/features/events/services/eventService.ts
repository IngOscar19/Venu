import apiClient from '@/lib/axios'
import type {
  EventDetailDto,
  CreateEventDto,
  UpdateEventDto,
  EventSectionDto,
  CreateEventSectionDto,
  EventImageDto,
  EventTypeDto,
  EventStatus,
  ImageType,
} from '@/types/api'

export const eventService = {
  getAll: async (params?: { search?: string; city?: string; fromDate?: string; status?: EventStatus }) => {
    const res = await apiClient.get<EventDetailDto[]>('/api/events', { params })
    return res.data
  },

  getMine: async () => {
    const res = await apiClient.get<EventDetailDto[]>('/api/events/mine')
    return res.data
  },

  getById: async (id: string) => {
    const res = await apiClient.get<EventDetailDto>(`/api/events/${id}`)
    return res.data
  },

  create: async (data: CreateEventDto) => {
    const res = await apiClient.post<EventDetailDto>('/api/events', data)
    return res.data
  },

  update: async (id: string, data: UpdateEventDto) => {
    const res = await apiClient.put<EventDetailDto>(`/api/events/${id}`, data)
    return res.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/events/${id}`)
  },

  publish: async (id: string) => {
    await apiClient.post(`/api/events/${id}/publish`)
  },

  cancel: async (id: string) => {
    await apiClient.post(`/api/events/${id}/cancel`)
  },

  addSection: async (eventId: string, data: CreateEventSectionDto) => {
    const res = await apiClient.post<EventSectionDto>(`/api/events/${eventId}/sections`, data)
    return res.data
  },

  uploadImage: async (eventId: string, file: File, type: ImageType = 'POSTER', order: number = 0) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('order', order.toString())

    const res = await apiClient.post<EventImageDto>(`/api/events/${eventId}/images/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  deleteImage: async (eventId: string, imageId: string) => {
    await apiClient.delete(`/api/events/${eventId}/images/${imageId}`)
  },

  deleteSection: async (eventId: string, sectionId: string) => {
    await apiClient.delete(`/api/events/${eventId}/sections/${sectionId}`)
  },

  getEventTypes: async () => {
    const res = await apiClient.get<EventTypeDto[]>('/api/event-types')
    return res.data
  },
}
