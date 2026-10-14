export type Role = 'ADMIN' | 'ORGANIZER' | 'CUSTOMER' | 'ACCESS_OPERATOR'

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'FINISHED' | number | string

export function normalizeEventStatus(status: any): 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'FINISHED' {
  if (status === 0 || status === '0' || String(status).toUpperCase() === 'DRAFT') return 'DRAFT'
  if (status === 1 || status === '1' || String(status).toUpperCase() === 'PUBLISHED') return 'PUBLISHED'
  if (status === 2 || status === '2' || String(status).toUpperCase() === 'CANCELLED') return 'CANCELLED'
  if (status === 3 || status === '3' || String(status).toUpperCase() === 'FINISHED') return 'FINISHED'
  return 'DRAFT'
}

export type ImageType = 'POSTER' | 'GALLERY' | 'VENUE' | 'ARTIST'

export type OrganizerStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'UNVERIFIED'

export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED'

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'

// ================= AUTH DTOs =================
export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string
  organizerName?: string
  organizerDescription?: string
}

export interface AuthResponseDto {
  token: string
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  organizerId?: string
  organizerStatus?: OrganizerStatus
}

export interface OrganizerProfileDto {
  id: string
  name: string
  description?: string
  status: OrganizerStatus
  verificationLevel?: string
}

export interface UserProfileDto {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
  organizer?: OrganizerProfileDto
}

// ================= EVENT DTOs =================
export interface EventTypeDto {
  id: string
  name: string
  slug: string
  isActive: boolean
}

export interface EventSectionDto {
  id: string
  eventId: string
  name: string
  description?: string
  capacity: number
  basePrice: number
}

export interface CreateEventSectionDto {
  name: string
  description?: string
  capacity: number
  basePrice: number
}

export interface EventImageDto {
  id: string
  eventId: string
  url: string
  type: ImageType
  order: number
}

export interface AddEventImageDto {
  url: string
  type: ImageType
  order: number
}

export interface EventDetailDto {
  id: string
  name: string
  slug: string
  description: string
  status: EventStatus
  startDate: string
  endDate: string
  startTime: string // "HH:mm:ss"
  endTime: string   // "HH:mm:ss"
  venueName: string
  address: string
  city: string
  state: string
  latitude?: number
  longitude?: number
  capacity: number
  eventTypeId?: string
  eventTypeName?: string
  organizerId: string
  organizerName?: string
  sections: EventSectionDto[]
  images: EventImageDto[]
}

export interface CreateEventDto {
  name: string
  description: string
  eventTypeId?: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  venueName: string
  address: string
  city: string
  state: string
  latitude: number
  longitude: number
  capacity: number
}

export interface UpdateEventDto {
  name: string
  description: string
  eventTypeId?: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  venueName: string
  address: string
  city: string
  state: string
  latitude?: number
  longitude?: number
  capacity: number
}

// ================= DASHBOARD DTOs =================
export interface DashboardRecentEventDto {
  id: string
  name: string
  categoryName?: string
  status: EventStatus
  startDate: string
  venueName: string
  capacity: number
  ticketsSold: number
  revenue: number
}

export interface DashboardCategoryStatDto {
  categoryName: string
  eventCount: number
  ticketsSold: number
}

export interface DashboardStatsDto {
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  cancelledEvents: number
  totalTicketsSold: number
  totalRevenue: number
  recentEvents: DashboardRecentEventDto[]
  categoryStats: DashboardCategoryStatDto[]
}

// ================= ADMIN DTOs =================
export type VerificationLevel = 'Unverified' | 'Basic' | 'Pro' | 'Enterprise'

export interface OrganizerAdminDto {
  id: string
  name: string
  description?: string
  status: OrganizerStatus
  verificationLevel: VerificationLevel
  userId: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
}

export interface UpdateVerificationLevelDto {
  verificationLevel: VerificationLevel
}

export interface SuspendOrganizerDto {
  reason: string
}

// ================= VERIFICATION DTOs =================
export interface SubmitVerificationDto {
  legalName: string
  taxId: string
  clabeAccount?: string
  companyDocumentUrl?: string
}

export interface OrganizerVerificationDetailDto {
  organizerId: string
  organizerName: string
  email: string
  legalName: string
  taxId: string
  clabeAccount?: string
  companyDocumentUrl?: string
  submittedAt: string
}

export interface ApproveOrganizerDto {
  level: VerificationLevel
  notes?: string
}

export interface RejectOrganizerDto {
  reason: string
}

export interface OrganizerMyVerificationResponse {
  status: OrganizerStatus
  verificationLevel: VerificationLevel
  verification?: {
    legalName: string
    taxId: string
    clabeAccount?: string
    companyDocumentUrl?: string
    submittedAt: string
    rejectionReason?: string
    reviewNotes?: string
  } | null
}

// ================= ERROR HANDLING =================
export interface ApiErrorResponse {
  message?: string
  error?: string
  errors?: Record<string, string[]>
  statusCode?: number
}
