import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, ArrowRight, Upload, Image as ImageIcon, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { API_BASE_URL } from '@/lib/axios'

export interface UploadedMediaItem {
  id: string
  url: string
  type: string
}

interface Step3MediaProps {
  images: UploadedMediaItem[]
  onUpload: (file: File, type: 'POSTER' | 'GALLERY') => Promise<void>
  onDelete?: (imageId: string) => void
  onNext: () => void
  onBack: () => void
  isUploading?: boolean
}

export function Step3Media({
  images,
  onUpload,
  onDelete,
  onNext,
  onBack,
  isUploading = false,
}: Step3MediaProps) {
  const [error, setError] = useState<string | null>(null)
  const [uploadingType, setUploadingType] = useState<'POSTER' | 'GALLERY' | null>(null)

  const posterInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const isDropActive = useRef(false)

  const [isDraggingPoster, setIsDraggingPoster] = useState(false)
  const [isDraggingGallery, setIsDraggingGallery] = useState(false)

  const handleProcessFile = async (file: File, type: 'POSTER' | 'GALLERY') => {
    if (!file) return
    if (uploadingType !== null || isUploading) return

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).')
      return
    }

    setError(null)
    setUploadingType(type)
    try {
      await onUpload(file, type)
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen al servidor.')
    } finally {
      setUploadingType(null)
      // Reset input value so same file can be re-uploaded if desired
      if (type === 'POSTER' && posterInputRef.current) {
        posterInputRef.current.value = ''
      }
      if (type === 'GALLERY' && galleryInputRef.current) {
        galleryInputRef.current.value = ''
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'POSTER' | 'GALLERY') => {
    const file = e.target.files?.[0]
    if (file) {
      handleProcessFile(file, type)
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'POSTER' | 'GALLERY') => {
    e.preventDefault()
    e.stopPropagation()
    if (type === 'POSTER') setIsDraggingPoster(false)
    if (type === 'GALLERY') setIsDraggingGallery(false)

    // Flag drop to ignore trailing click on the container
    isDropActive.current = true
    setTimeout(() => {
      isDropActive.current = false
    }, 400)

    if (uploadingType !== null || isUploading) return

    // Ensure we only process files dropped from the OS, not dragged DOM elements
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return

    const file = e.dataTransfer.files[0]
    if (file) {
      handleProcessFile(file, type)
    }
  }

  const resolveImageUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const posterImage = images.find((i) => i.type === 'POSTER')
  const galleryImages = images.filter((i) => i.type !== 'POSTER')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-[#F0F6FC] font-headline">Multimedia e Imágenes</h2>
        <p className="text-xs text-[#8B949E] mt-0.5">
          Haz clic en cualquier recuadro o arrastra archivos para abrir el explorador de tu equipo.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-medium rounded-xl">
          {error}
        </div>
      )}

      {/* Hidden inputs directly controlled via refs */}
      <input
        ref={posterInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => handleInputChange(e, 'POSTER')}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => handleInputChange(e, 'GALLERY')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Poster Dropzone */}
        <div
          onClick={() => {
            if (isDropActive.current || uploadingType !== null || isUploading) return
            posterInputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDraggingPoster(true)
          }}
          onDragLeave={() => setIsDraggingPoster(false)}
          onDrop={(e) => handleDrop(e, 'POSTER')}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] bg-[#0D1117] group ${
            isDraggingPoster
              ? 'border-[#FA4616] bg-[#FA4616]/10 scale-[1.01]'
              : 'border-[#30363D] hover:border-[#FA4616] hover:bg-[#161B22]'
          }`}
        >
          {uploadingType === 'POSTER' ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#FA4616] animate-spin" />
              <p className="text-xs font-semibold text-[#F0F6FC]">Subiendo imagen de portada...</p>
            </div>
          ) : posterImage ? (
            <div className="relative w-full h-full flex flex-col items-center">
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 border border-[#30363D]">
                <img
                  src={resolveImageUrl(posterImage.url)}
                  alt="Portada del Evento"
                  draggable={false}
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
                <span className="absolute top-2 right-2 bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Portada actual
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs gap-1.5 pointer-events-none"
              >
                <Upload className="w-3.5 h-3.5 text-[#FA4616]" />
                Cambiar imagen de portada
              </Button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#FA4616]/15 text-[#FA4616] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[#F0F6FC]">Imagen de Portada (Poster)</p>
              <p className="text-[11px] font-mono text-[#8B949E] mt-1">
                Haz clic o arrastra un archivo aquí (JPG, PNG)
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="pointer-events-none text-xs gap-1.5 font-semibold"
                >
                  Examinar archivos
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Gallery Dropzone */}
        <div
          onClick={() => {
            if (isDropActive.current || uploadingType !== null || isUploading) return
            galleryInputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDraggingGallery(true)
          }}
          onDragLeave={() => setIsDraggingGallery(false)}
          onDrop={(e) => handleDrop(e, 'GALLERY')}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] bg-[#0D1117] group ${
            isDraggingGallery
              ? 'border-[#8DA4EF] bg-[#003087]/20 scale-[1.01]'
              : 'border-[#30363D] hover:border-[#8DA4EF] hover:bg-[#161B22]'
          }`}
        >
          {uploadingType === 'GALLERY' ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#8DA4EF] animate-spin" />
              <p className="text-xs font-semibold text-[#F0F6FC]">Subiendo a la galería...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#003087]/25 text-[#8DA4EF] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-[#F0F6FC]">Galería de Fotos</p>
              <p className="text-[11px] font-mono text-[#8B949E] mt-1">
                Fotos del recinto, escenario o artistas
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="pointer-events-none text-xs gap-1.5 font-semibold"
                >
                  Agregar foto a la galería
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gallery preview list */}
      {galleryImages.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-mono font-medium text-[#8B949E] uppercase tracking-wider">
            Fotos en Galería ({galleryImages.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-xl overflow-hidden border border-[#30363D] h-28 bg-[#0D1117]"
              >
                <img
                  src={resolveImageUrl(img.url)}
                  alt="Gallery Item"
                  draggable={false}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none select-none"
                />
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(img.id)
                    }}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="absolute bottom-1 left-1 bg-black/80 text-[#F5A894] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                  GALERÍA
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-[#21262D]">
        <Button variant="secondary" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </Button>
        <Button variant="default" size="lg" onClick={onNext} className="gap-2 font-bold">
          Revisar y Finalizar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
