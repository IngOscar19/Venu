import { useEffect, useState, useRef } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

export function VersionChecker() {
  const [hasNewVersion, setHasNewVersion] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const initialScriptHashRef = useRef<string | null>(null)

  useEffect(() => {
    // 1. Detect current main bundle script hash from document
    const currentScript = document.querySelector('script[src*="/assets/index-"]') as HTMLScriptElement | null
    if (currentScript?.src) {
      initialScriptHashRef.current = currentScript.src
    }

    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        })

        if (!response.ok) return
        const html = await response.text()

        // Match the entry script in the fetched HTML
        const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/)
        if (match && match[1]) {
          const fetchedScript = match[1]

          if (initialScriptHashRef.current) {
            const currentPath = new URL(initialScriptHashRef.current, window.location.origin).pathname
            if (fetchedScript !== currentPath) {
              setHasNewVersion(true)
            }
          } else {
            initialScriptHashRef.current = fetchedScript
          }
        }
      } catch {
        // Ignore fetch errors during navigation or offline
      }
    }

    // Check when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates()
      }
    }

    // Periodic check every 60 seconds
    const interval = setInterval(checkForUpdates, 60000)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleApplyUpdate = () => {
    setIsUpdating(true)
    setTimeout(() => {
      window.location.reload()
    }, 400)
  }

  if (!hasNewVersion) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 rounded-2xl bg-[#161B22]/95 px-4 py-3 text-xs font-mono text-[#F0F6FC] border border-[#FA4616]/50 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-300">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FA4616]/20 text-[#FA4616] shrink-0">
        <Sparkles className="h-4 w-4 animate-pulse" />
      </div>
      <div>
        <p className="font-bold text-white">¡Nueva versión disponible!</p>
        <p className="text-[11px] text-[#8B949E]">Hay cambios recientes listos en Venú.</p>
      </div>
      <button
        onClick={handleApplyUpdate}
        disabled={isUpdating}
        className="ml-2 inline-flex items-center gap-1.5 rounded-xl bg-[#FA4616] px-3 py-1.5 font-bold text-white hover:bg-[#FF6B35] transition-all shadow-md active:scale-95 disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
        <span>{isUpdating ? 'Actualizando...' : 'Actualizar ahora'}</span>
      </button>
    </div>
  )
}
