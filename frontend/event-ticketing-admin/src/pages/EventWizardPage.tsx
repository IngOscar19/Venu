import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { eventService } from '@/features/events/services/eventService'
import { useEventDetail } from '@/features/events/hooks/useEvents'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { PageHeader } from '@/components/shared/PageHeader'
import { Step1General, type Step1FormValues } from '@/features/events/wizard/Step1General'
import { Step2Sections, type WizardSectionItem } from '@/features/events/wizard/Step2Sections'
import { Step3Media, type UploadedMediaItem } from '@/features/events/wizard/Step3Media'
import { Step4Review } from '@/features/events/wizard/Step4Review'
import { Calendar, Layers, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export function EventWizardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)

  const [currentStep, setCurrentStep] = useState(1)
  const [createdEventId, setCreatedEventId] = useState<string | null>(id || null)
  const [generalData, setGeneralData] = useState<Step1FormValues | null>(null)
  const [sections, setSections] = useState<WizardSectionItem[]>([
    { name: 'General', capacity: 100, basePrice: 25 },
  ])
  const [images, setImages] = useState<UploadedMediaItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: eventTypes } = useQuery({
    queryKey: QUERY_KEYS.eventTypes.all,
    queryFn: () => eventService.getEventTypes(),
  })

  // Load existing event data if in edit mode
  const { data: existingEvent, isLoading: isLoadingEvent } = useEventDetail(id)

  useEffect(() => {
    if (existingEvent) {
      setCreatedEventId(existingEvent.id)
      setGeneralData({
        name: existingEvent.name,
        description: existingEvent.description || '',
        eventTypeId: existingEvent.eventTypeId || '',
        startDate: existingEvent.startDate ? existingEvent.startDate.substring(0, 10) : '',
        endDate: existingEvent.endDate ? existingEvent.endDate.substring(0, 10) : '',
        startTime: existingEvent.startTime ? existingEvent.startTime.substring(0, 5) : '19:00',
        endTime: existingEvent.endTime ? existingEvent.endTime.substring(0, 5) : '22:00',
        venueName: existingEvent.venueName,
        address: existingEvent.address,
        city: existingEvent.city,
        state: existingEvent.state,
        capacity: existingEvent.capacity,
        latitude: existingEvent.latitude ?? 0,
        longitude: existingEvent.longitude ?? 0,
      })

      if (existingEvent.sections && existingEvent.sections.length > 0) {
        setSections(
          existingEvent.sections.map((sec) => ({
            name: sec.name,
            description: sec.description,
            capacity: sec.capacity,
            basePrice: sec.basePrice,
          }))
        )
      }

      if (existingEvent.images && existingEvent.images.length > 0) {
        const uniqueImages: UploadedMediaItem[] = []
        const seenIds = new Set<string>()
        let foundPoster = false

        for (const img of existingEvent.images) {
          if (seenIds.has(img.id)) continue
          seenIds.add(img.id)

          if (img.type === 'POSTER') {
            if (foundPoster) continue // omitir posters viejos duplicados
            foundPoster = true
          }

          uniqueImages.push({
            id: img.id,
            url: img.url,
            type: img.type,
          })
        }
        setImages(uniqueImages)
      }
    }
  }, [existingEvent])

  const handleStep1Submit = async (values: Step1FormValues) => {
    setError(null)
    setIsSubmitting(true)
    try {
      setGeneralData(values)
      const payload = {
        name: values.name,
        description: values.description,
        eventTypeId: values.eventTypeId || undefined,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        startTime: values.startTime.includes(':') && values.startTime.length === 5 ? `${values.startTime}:00` : values.startTime,
        endTime: values.endTime.includes(':') && values.endTime.length === 5 ? `${values.endTime}:00` : values.endTime,
        venueName: values.venueName,
        address: values.address,
        city: values.city,
        state: values.state,
        capacity: Number(values.capacity),
        latitude: values.latitude,
        longitude: values.longitude,
      }

      if (!createdEventId) {
        const res = await eventService.create(payload)
        setCreatedEventId(res.id)
      } else {
        await eventService.update(createdEventId, payload)
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      }

      // Automatically refresh event lists & dashboard so changes are instantly visible
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })

      setCurrentStep(2)
    } catch (err: any) {
      setError(err.message || 'Error al guardar los datos del evento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddSection = async (section: WizardSectionItem) => {
    if (!createdEventId) {
      setError('Debes guardar la información general en el Paso 1 antes de agregar secciones.')
      return
    }
    try {
      await eventService.addSection(createdEventId, {
        name: section.name,
        capacity: section.capacity,
        basePrice: section.basePrice,
      })
      setSections([...sections, section])
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
    } catch (err: any) {
      setError(err.message || 'Error al guardar la sección.')
    }
  }

  const handleRemoveSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx))
  }

  const handleUploadImage = async (file: File, type: 'POSTER' | 'GALLERY') => {
    if (!createdEventId) {
      setError('Debes guardar la información general en el Paso 1 antes de subir imágenes.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await eventService.uploadImage(createdEventId, file, type, images.length + 1)
      if (type === 'POSTER') {
        // Replace existing poster if present
        setImages((prev) => [
          ...prev.filter((i) => i.type !== 'POSTER'),
          { id: res.id, url: res.url, type: res.type },
        ])
      } else {
        setImages((prev) => [
          ...prev.filter((i) => i.id !== res.id),
          { id: res.id, url: res.url, type: res.type },
        ])
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen al servidor.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!createdEventId) return
    try {
      await eventService.deleteImage(createdEventId, imageId)
      setImages(images.filter((img) => img.id !== imageId))
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la imagen.')
    }
  }

  const handlePublish = async () => {
    if (!createdEventId) return
    setIsSubmitting(true)
    try {
      await eventService.publish(createdEventId)
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
      navigate('/events')
    } catch (err: any) {
      setError(err.message || 'Error al publicar el evento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditMode && isLoadingEvent) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#FA4616]" />
          <p className="text-xs font-semibold text-[#8B949E] font-mono">
            Cargando borrador del evento...
          </p>
        </div>
      </div>
    )
  }

  const steps = [
    { number: 1, title: 'Información General', icon: Calendar },
    { number: 2, title: 'Secciones y Precios', icon: Layers },
    { number: 3, title: 'Multimedia', icon: ImageIcon },
    { number: 4, title: 'Revisión y Publicación', icon: CheckCircle2 },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={isEditMode ? 'Editar Borrador de Evento' : 'Crear Nuevo Evento'}
        description={
          isEditMode
            ? 'Modifica los datos generales, secciones, boletos o imágenes de tu evento'
            : 'Publica un nuevo evento en tu cartelera paso a paso'
        }
      />

      {/* Stepper Progress */}
      <div className="bg-[#161B22] rounded-2xl p-4 sm:p-5 border border-[#30363D]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((s) => {
            const Icon = s.icon
            const isCompleted = currentStep > s.number
            const isCurrent = currentStep === s.number

            return (
              <button
                key={s.number}
                type="button"
                onClick={() => {
                  // Allow clicking previous steps or steps if event was created/loaded
                  if (createdEventId || isCompleted) {
                    setCurrentStep(s.number)
                  }
                }}
                disabled={!createdEventId && s.number > currentStep}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                  isCurrent
                    ? 'bg-[#21262D] border border-[#FA4616]/40 cursor-default'
                    : isCompleted || createdEventId
                    ? 'opacity-85 hover:bg-[#21262D]/60 cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-mono transition-colors ${
                    isCurrent
                      ? 'bg-[#FA4616] text-white shadow-md shadow-[#FA4616]/25'
                      : isCompleted
                      ? 'bg-[#003087] text-[#8DA4EF] border border-[#003087]'
                      : 'bg-[#21262D] text-[#8B949E]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono font-medium uppercase tracking-wider text-[#8B949E]">
                    Paso 0{s.number}
                  </span>
                  <span className="block text-xs font-semibold text-[#F0F6FC] truncate">
                    {s.title}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-3 text-xs text-rose-300 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Wizard Content Card */}
      <div className="bg-[#161B22] rounded-2xl p-6 sm:p-8 border border-[#30363D] shadow-sm">
        {currentStep === 1 && (
          <Step1General
            initialValues={generalData || undefined}
            eventTypes={eventTypes}
            isLoading={isSubmitting}
            onSubmit={handleStep1Submit}
          />
        )}

        {currentStep === 2 && (
          <Step2Sections
            sections={sections}
            maxCapacity={generalData?.capacity || 500}
            onAddSection={handleAddSection}
            onRemoveSection={handleRemoveSection}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3Media
            images={images}
            onUpload={handleUploadImage}
            onDelete={handleDeleteImage}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
            isUploading={isSubmitting}
          />
        )}

        {currentStep === 4 && generalData && (
          <Step4Review
            generalData={generalData}
            sections={sections}
            hasPoster={images.some((i) => i.type === 'POSTER')}
            isSubmitting={isSubmitting}
            onBack={() => setCurrentStep(3)}
            onSaveDraft={() => navigate('/events')}
            onPublish={handlePublish}
          />
        )}
      </div>
    </div>
  )
}

export default EventWizardPage
