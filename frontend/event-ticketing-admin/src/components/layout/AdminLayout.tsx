import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#0D1117] text-[#F0F6FC]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 min-h-0 h-full overflow-hidden">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main
          id="main-scroll-container"
          className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-32 sm:pb-16 lg:pb-8 bg-[#0D1117] touch-pan-y overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
