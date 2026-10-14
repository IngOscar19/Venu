import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl p-2 text-xs font-mono font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FA4616]',
        isDark
          ? 'bg-[#21262D] text-[#F0F6FC] hover:bg-[#30363D] hover:text-[#FA4616] border border-[#30363D]'
          : 'bg-[#F0F2F5] text-[#1F2328] hover:bg-[#E1E4E8] hover:text-[#FA4616] border border-[#D0D7DE] shadow-xs',
        className
      )}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label="Alternar tema claro/oscuro"
    >
      <div className="relative h-4 w-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="h-4 w-4 text-[#FA4616] transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-[#003087] transition-transform duration-300 -rotate-12" />
        )}
      </div>
      {showLabel && (
        <span className="text-[11px] font-medium">
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  )
}

export default ThemeToggle
