import { useState, useEffect, useRef } from 'react'
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
  const [sections, setSections] = useState<WizardSectionItem[]>(() =>
    isEditMode ? [] : [{ name: 'General', capacity: 100, basePrice: 25 }]
  )
  const [images, setImages] = useState<UploadedMediaItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pendingStepRef = useRef<number | null>(null)

  const { data: eventTypes } = useQuery({
    queryKey: QUERY_KEYS.eventTypes.all,
    queryFn: () => eventService.getEventTypes(),
  })

  // Load existing event data if in edit mode
  const { data: existingEvent, isLoading: isLoadingEvent } = useEventDetail(id)

  useEffect(() => {
    if (existingEvent) {
      setCreatedEventId(existingEvent.id)
      const rawEventTypeId =
        existingEvent.eventTypeId ||
        (existingEvent as any).eventType?.id ||
        (existingEvent as any).type?.id ||
        ''

      setGeneralData({
        name: existingEvent.name || '',
        description: existingEvent.description || '',
        eventTypeId: rawEventTypeId,
        startDate: existingEvent.startDate ? existingEvent.startDate.substring(0, 10) : '',
        endDate: existingEvent.endDate ? existingEvent.endDate.substring(0, 10) : '',
        startTime: existingEvent.startTime ? existingEvent.startTime.substring(0, 5) : '19:00',
        endTime: existingEvent.endTime ? existingEvent.endTime.substring(0, 5) : '22:00',
        venueName: existingEvent.venueName || '',
        address: existingEvent.address || '',
        city: existingEvent.city || '',
        state: existingEvent.state || '',
        capacity: existingEvent.capacity || 500,
        latitude: existingEvent.latitude ?? 0,
        longitude: existingEvent.longitude ?? 0,
      })

      if (existingEvent.sections) {
        setSections(
          existingEvent.sections.map((sec) => ({
            id: sec.id,
            name: sec.name,
            description: sec.description,
            capacity: sec.capacity,
            basePrice: sec.basePrice,
          }))
        )
      }

      if (existingEvent.images) {
        const uniqueImages: UploadedMediaItem[] = []
        const seenIds = new Set<string>()
        let foundPoster = false

        for (const img of existingEvent.images) {
          if (seenIds.has(img.id)) continue
          seenIds.add(img.id)

          if (img.type === 'POSTER') {
            if (foundPoster) continue
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
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      }

      // Automatically refresh event lists & dashboard so changes are instantly visible
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })

      const next = pendingStepRef.current || 2
      pendingStepRef.current = null
      setCurrentStep(next)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar los datos del evento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStepClick = (targetStep: number) => {
    if (targetStep === currentStep) return

    // If currently editing Step 1, auto-submit the form so modifications are persisted to DB
    if (currentStep === 1) {
      const formEl = document.getElementById('step1-form') as HTMLFormElement | null
      if (formEl) {
        pendingStepRef.current = targetStep
        formEl.requestSubmit()
        return
      }
    }

    setCurrentStep(targetStep)
  }

  const handleAddSection = async (section: WizardSectionItem) => {
    if (!createdEventId) {
      setError('Debes guardar la información general en el Paso 1 antes de agregar secciones.')
      return
    }
    setError(null)
    try {
      const res = await eventService.addSection(createdEventId, {
        name: section.name,
        capacity: section.capacity,
        basePrice: section.basePrice,
      })
      setSections((prev) => [...prev, { ...section, id: res.id }])
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar la sección.'
      setError(msg)
      throw new Error(msg)
    }
  }

  const handleRemoveSection = async (idx: number) => {
    const section = sections[idx]
    setError(null)
    if (createdEventId && section?.id) {
      try {
        await eventService.deleteSection(createdEventId, section.id)
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Error al eliminar la sección en el servidor.'
        setError(msg)
        throw new Error(msg)
      }
    }
    setSections((prev) => prev.filter((_, i) => i !== idx))
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
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al subir la imagen al servidor.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!createdEventId) return
    try {
      await eventService.deleteImage(createdEventId, imageId)
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al eliminar la imagen.')
    }
  }

  const handleSaveAndFinish = async () => {
    if (!createdEventId) return
    setIsSubmitting(true)
    try {
      if (generalData) {
        const payload = {
          name: generalData.name,
          description: generalData.description,
          eventTypeId: generalData.eventTypeId || undefined,
          startDate: new Date(generalData.startDate).toISOString(),
          endDate: new Date(generalData.endDate).toISOString(),
          startTime: generalData.startTime.includes(':') && generalData.startTime.length === 5 ? `${generalData.startTime}:00` : generalData.startTime,
          endTime: generalData.endTime.includes(':') && generalData.endTime.length === 5 ? `${generalData.endTime}:00` : generalData.endTime,
          venueName: generalData.venueName,
          address: generalData.address,
          city: generalData.city,
          state: generalData.state,
          capacity: Number(generalData.capacity),
          latitude: generalData.latitude,
          longitude: generalData.longitude,
        }
        await eventService.update(createdEventId, payload)
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(createdEventId) })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.mine })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all })
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard.stats })
      navigate(`/events/${createdEventId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar los cambios del evento.')
    } finally {
      setIsSubmitting(false)
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
      navigate(`/events/${createdEventId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al publicar el evento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditMode && (isLoadingEvent || !existingEvent || !generalData)) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#FA4616]" />
          <p className="text-xs font-semibold text-[#8B949E] font-mono">
            Cargando datos del evento...
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
        title={isEditMode ? 'Editar Evento' : 'Crear Nuevo Evento'}
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
                  if (createdEventId || isCompleted) {
                    handleStepClick(s.number)
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
            key={isEditMode ? `edit-${id}-${generalData?.name || ''}` : 'create'}
            initialValues={generalData || undefined}
            eventTypes={eventTypes}
            isLoading={isSubmitting}
            onSubmit={handleStep1Submit}
            isEditMode={isEditMode}
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
            isEditMode={isEditMode}
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
            isEditMode={isEditMode}
            onBack={() => setCurrentStep(3)}
            onSaveDraft={handleSaveAndFinish}
            onPublish={isEditMode ? handleSaveAndFinish : handlePublish}
          />
        )}
      </div>
    </div>
  )
}

export default EventWizardPage
