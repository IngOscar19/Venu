import { Link } from 'react-router-dom'
import { Menu, User as UserIcon, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

interface HeaderProps {
  onOpenSidebar: () => void
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 w-full items-center justify-between border-b border-[#21262D] bg-[#161B22]/90 px-4 sm:px-6 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile brand indicator */}
        <div className="flex items-center gap-2 lg:hidden">
          <img src="/venu-icon-transparent.png" alt="Venú" className="h-7 w-auto object-contain" />
          <span className="text-base font-bold text-[#F0F6FC] font-headline tracking-tight">
            Ven<span className="text-[#FA4616]">ú</span>
          </span>
        </div>

        {/* Global Search box inspired directly by the Stitch preview Search input */}
        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8B949E]" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-full rounded-xl border border-[#30363D] bg-[#0D1117] pl-10 pr-4 text-xs font-mono text-[#F0F6FC] placeholder:text-[#6E7681] focus:border-[#FA4616] focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark / Light Mode Toggle */}
        <ThemeToggle />

        {/* User indicator - Clickable link to /account */}
        <Link
          to="/account"
          className="flex items-center gap-2 pl-3 border-l border-[#21262D] group cursor-pointer hover:opacity-90 transition-opacity"
          title="Ver información de mi cuenta"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#21262D] border border-[#30363D] text-[#FA4616] text-xs font-bold group-hover:border-[#FA4616] group-hover:bg-[#FA4616]/10 transition-colors shadow-sm">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-[#F0F6FC] leading-none group-hover:text-[#FA4616] transition-colors">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] font-mono text-[#8B949E] mt-0.5">{user?.email}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
