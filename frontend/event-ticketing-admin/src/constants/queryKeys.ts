export const QUERY_KEYS = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  events: {
    all: ['events'] as const,
    list: (filters?: Record<string, any>) => ['events', 'list', filters] as const,
    mine: ['events', 'mine'] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
    sections: (eventId: string) => ['events', eventId, 'sections'] as const,
  },
  eventTypes: {
    all: ['event-types'] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
  refunds: {
    all: ['refunds'] as const,
    list: (filters?: Record<string, any>) => ['refunds', 'list', filters] as const,
    eventSummary: (eventId: string) => ['refunds', 'event-summary', eventId] as const,
  },
} as const
