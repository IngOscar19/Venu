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
} as const
