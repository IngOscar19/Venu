/**
 * Stitch Design System Color Tokens
 * Primary: #FA4616 (Vibrant Orange)
 * Secondary: #003087 (Deep Blue)
 * Tertiary: #FF6B35 (Warm Coral)
 * Neutral: #0D1117 (Dark Background)
 */
export const STITCH_COLORS = {
  primary: {
    DEFAULT: '#FA4616',
    hover: '#ff5c2e',
    active: '#d9390d',
    tint: '#F5A894',
    tintSoft: '#FFD8C9',
    subtle: 'rgba(250, 70, 22, 0.12)',
  },
  secondary: {
    DEFAULT: '#003087',
    hover: '#0041b3',
    light: '#8DA4EF',
    tint: '#B8C8F8',
    subtle: 'rgba(0, 48, 135, 0.2)',
  },
  tertiary: {
    DEFAULT: '#FF6B35',
    hover: '#ff8254',
    light: '#FFA07A',
    subtle: 'rgba(255, 107, 53, 0.15)',
  },
  neutral: {
    background: '#0D1117',
    surface: '#161B22',
    surfaceElevated: '#21262D',
    border: '#30363D',
    borderSubtle: '#21262D',
    borderHighlight: '#484F58',
    text: '#F0F6FC',
    textMuted: '#8B949E',
    textDark: '#6E7681',
  },
  status: {
    draft: {
      bg: 'rgba(139, 148, 158, 0.12)',
      text: '#8B949E',
      border: 'rgba(139, 148, 158, 0.3)',
      badge: 'bg-[#21262D] text-[#8B949E] border-[#30363D]',
    },
    published: {
      bg: 'rgba(63, 185, 80, 0.12)',
      text: '#3FB950',
      border: 'rgba(63, 185, 80, 0.3)',
      badge: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
    },
    cancelled: {
      bg: 'rgba(248, 81, 73, 0.12)',
      text: '#F85149',
      border: 'rgba(248, 81, 73, 0.3)',
      badge: 'bg-rose-950/40 text-rose-400 border-rose-800/60',
    },
    finished: {
      bg: 'rgba(88, 166, 255, 0.12)',
      text: '#58A6FF',
      border: 'rgba(88, 166, 255, 0.3)',
      badge: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
    },
  },
} as const

// Backwards-compatible alias for existing imports
export const BRONCOS_COLORS = STITCH_COLORS
