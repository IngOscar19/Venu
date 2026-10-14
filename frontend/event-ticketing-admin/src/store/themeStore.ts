import { create } from 'zustand'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  const storedTheme = localStorage.getItem('theme') as Theme | null
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }
  return 'dark'
}

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.add('light')
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  } else {
    root.classList.add('dark')
    root.classList.remove('light')
    root.setAttribute('data-theme', 'dark')
  }
}

// Initial apply
if (typeof window !== 'undefined') {
  applyThemeToDOM(getInitialTheme())
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  setTheme: (theme: Theme) => {
    localStorage.setItem('theme', theme)
    applyThemeToDOM(theme)
    set({ theme })
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme: Theme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', nextTheme)
      applyThemeToDOM(nextTheme)
      return { theme: nextTheme }
    })
  },
}))
