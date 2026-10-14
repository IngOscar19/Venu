import apiClient from '@/lib/axios'
import type {
  OrganizerAdminDto,
  UpdateVerificationLevelDto,
  SuspendOrganizerDto,
  OrganizerStatus,
  VerificationLevel,
  OrganizerVerificationDetailDto,
  ApproveOrganizerDto,
  RejectOrganizerDto,
} from '@/types/api'

export const adminService = {
  getOrganizers: async (params?: {
    search?: string
    status?: OrganizerStatus
    level?: VerificationLevel
  }) => {
    const res = await apiClient.get<OrganizerAdminDto[]>('/api/admin/organizers', { params })
    return res.data
  },

  getOrganizerById: async (id: string) => {
    const res = await apiClient.get<OrganizerAdminDto>(`/api/admin/organizers/${id}`)
    return res.data
  },

  updateVerificationLevel: async (id: string, data: UpdateVerificationLevelDto) => {
    const res = await apiClient.put<OrganizerAdminDto>(
      `/api/admin/organizers/${id}/verification-level`,
      data
    )
    return res.data
  },

  suspendOrganizer: async (id: string, data: SuspendOrganizerDto) => {
    await apiClient.post(`/api/admin/organizers/${id}/suspend`, data)
  },

  getPendingVerifications: async (): Promise<OrganizerVerificationDetailDto[]> => {
    const res = await apiClient.get<OrganizerVerificationDetailDto[]>('/api/admin/organizers/pending-verifications')
    return res.data
  },

  approveOrganizer: async (id: string, data: ApproveOrganizerDto): Promise<void> => {
    await apiClient.post(`/api/admin/organizers/${id}/approve`, data)
  },

  rejectOrganizer: async (id: string, data: RejectOrganizerDto): Promise<void> => {
    await apiClient.post(`/api/admin/organizers/${id}/reject`, data)
  },
}
