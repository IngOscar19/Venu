import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ExternalLink, Image as ImageIcon } from 'lucide-react'

export interface LightboxImageItem {
  id: string
  url: string
  type?: string
  alt?: string
}

interface EventImageLightboxProps {
  images: LightboxImageItem[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
  eventName?: string
}

export function EventImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  eventName = 'Evento',
}: EventImageLightboxProps) {
  const currentImage = images[currentIndex]

  // Keyboard navigation: Escape, ArrowLeft, ArrowRight
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onNavigate((currentIndex - 1 + images.length) % images.length)
      } else if (e.key === 'ArrowRight') {
        onNavigate((currentIndex + 1) % images.length)
      }
    },
    [isOpen, currentIndex, images.length, onClose, onNavigate]
  )

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen || !currentImage) return null

  const isPoster = currentImage.type === 'POSTER' || currentIndex === 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-between bg-black/95 backdrop-blur-2xl p-4 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Top Bar: Event title, Image Counter & Action buttons */}
      <div className="w-full max-w-6xl flex items-center justify-between gap-4 z-10 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FA4616]/20 text-[#FA4616] shrink-0 border border-[#FA4616]/30">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate font-headline">{eventName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FA4616] bg-[#FA4616]/10 px-2 py-0.5 rounded-md border border-[#FA4616]/30 font-semibold">
                {isPoster ? 'Foto de Portada' : 'Galería'}
              </span>
              <span className="text-xs font-mono text-[#8B949E]">
                {currentIndex + 1} de {images.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={currentImage.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#30363D] bg-[#161B22]/90 hover:bg-[#21262D] px-3 text-xs font-mono text-[#F0F6FC] hover:text-[#FA4616] transition-all shadow-md"
            title="Abrir imagen original en nueva pestaña"
          >
            <span className="hidden sm:inline">Ver original</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#30363D] bg-[#161B22]/90 text-[#8B949E] hover:text-white hover:bg-rose-950/40 hover:border-rose-500/50 transition-all shadow-md active:scale-95"
            title="Cerrar (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display with Side Arrows */}
      <div className="relative flex-1 w-full max-w-6xl flex items-center justify-center my-auto min-h-0">
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((currentIndex - 1 + images.length) % images.length)
            }}
            className="absolute left-1 sm:left-4 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#161B22]/80 hover:bg-[#FA4616] text-white hover:text-white border border-[#30363D] hover:border-[#FA4616] backdrop-blur-md transition-all shadow-2xl active:scale-90"
            title="Foto anterior (←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Active Full Image Container */}
        <div
          className="relative max-h-[72vh] max-w-[90vw] flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl border border-white/10 bg-black/40"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.alt || eventName}
            className="max-h-[72vh] max-w-full object-contain rounded-2xl animate-in fade-in zoom-in-95 duration-200"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate((currentIndex + 1) % images.length)
            }}
            className="absolute right-1 sm:right-4 z-20 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#161B22]/80 hover:bg-[#FA4616] text-white hover:text-white border border-[#30363D] hover:border-[#FA4616] backdrop-blur-md transition-all shadow-2xl active:scale-90"
            title="Foto siguiente (→)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 z-10 scrollbar-thin">
          {images.map((img, idx) => {
            const isActive = idx === currentIndex
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(idx)
                }}
                className={`relative h-14 w-20 sm:h-16 sm:w-24 shrink-0 rounded-xl overflow-hidden transition-all duration-200 ${
                  isActive
                    ? 'ring-2 ring-[#FA4616] ring-offset-2 ring-offset-black scale-105 opacity-100 shadow-lg'
                    : 'opacity-40 hover:opacity-80 scale-95 border border-[#30363D]'
                }`}
              >
                <img src={img.url} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
                {img.type === 'POSTER' && (
                  <span className="absolute bottom-0.5 left-0.5 right-0.5 bg-black/80 text-[8px] font-mono text-[#F5A894] py-0.2 rounded text-center truncate">
                    Portada
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
