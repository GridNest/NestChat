export const CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  CHAT: {
    MAX_MESSAGE_LENGTH: 5000,
    SESSION_TIMEOUT_MINUTES: 30,
    TYPING_DELAY_MS: 1000,
  },

  INQUIRY: {
    FIELDS: ['name', 'email', 'phone', 'country', 'state', 'service', 'details'],
    OPTIONAL_FIELDS: ['company'],
  },

  CACHE: {
    WIDGET_CONFIG_TTL: 3600,
    KNOWLEDGE_TTL: 1800,
    FAQ_TTL: 1800,
  },

  RATE_LIMIT: {
    CHAT: 30,
    WIDGET: 100,
    AUTH: 5,
  },
} as const;
