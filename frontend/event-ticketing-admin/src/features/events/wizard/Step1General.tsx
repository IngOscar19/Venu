import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LocationMapPicker } from '@/features/events/components/LocationMapPicker'
import type { EventTypeDto } from '@/types/api'
import { ArrowRight } from 'lucide-react'

export const step1Schema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'Ingresa una descripción de al menos 10 caracteres'),
  eventTypeId: z.string().optional(),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  startTime: z.string().min(1, 'La hora de inicio es requerida'),
  endTime: z.string().min(1, 'La hora de fin es requerida'),
  venueName: z.string().min(2, 'El recinto o lugar es requerido'),
  address: z.string().min(3, 'La dirección es requerida'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado o provincia es requerido'),
  capacity: z.number().min(1, 'La capacidad debe ser mayor a 0'),
  latitude: z.number().min(-90, 'Latitud inválida').max(90, 'Latitud inválida'),
  longitude: z.number().min(-180, 'Longitud inválida').max(180, 'Longitud inválida'),
})

export type Step1FormValues = z.infer<typeof step1Schema>

interface Step1GeneralProps {
  initialValues?: Partial<Step1FormValues>
  eventTypes?: EventTypeDto[]
  isLoading?: boolean
  onSubmit: (values: Step1FormValues) => void
}

export function Step1General({
  initialValues,
  eventTypes,
  isLoading,
  onSubmit,
}: Step1GeneralProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      eventTypeId: initialValues?.eventTypeId || '',
      venueName: initialValues?.venueName || '',
      address: initialValues?.address || '',
      city: initialValues?.city || '',
      state: initialValues?.state || '',
      capacity: initialValues?.capacity || 500,
      startDate: initialValues?.startDate || new Date().toISOString().split('T')[0],
      endDate: initialValues?.endDate || new Date().toISOString().split('T')[0],
      startTime: initialValues?.startTime || '19:00',
      endTime: initialValues?.endTime || '23:00',
      latitude: initialValues?.latitude ?? undefined,
      longitude: initialValues?.longitude ?? undefined,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Nombre del Evento"
            placeholder="Ej. Concierto Sinfónico 2026"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div>
          <Select
            label="Categoría"
            placeholder="Selecciona una categoría..."
            error={errors.eventTypeId?.message}
            {...register('eventTypeId')}
          >
            <option value="">Selecciona una categoría...</option>
            {eventTypes?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Input
            label="Aforo Máximo (Personas)"
            type="number"
            placeholder="500"
            error={errors.capacity?.message}
            {...register('capacity', { valueAsNumber: true })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-mono font-medium tracking-wider text-[#8B949E] uppercase mb-1.5">
            Descripción
          </label>
          <textarea
            rows={3}
            placeholder="Describe la experiencia, cronograma, recomendaciones..."
            className="flex w-full rounded-xl border border-[#30363D] bg-[#161B22] px-3.5 py-2 text-sm text-[#F0F6FC] placeholder:text-[#6E7681] focus:outline-none focus:border-[#FA4616]"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-rose-400 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <Input label="Fecha de Inicio" type="date" error={errors.startDate?.message} {...register('startDate')} />
        </div>
        <div>
          <Input label="Fecha de Fin" type="date" error={errors.endDate?.message} {...register('endDate')} />
        </div>
        <div>
          <Input label="Hora de Inicio" type="time" error={errors.startTime?.message} {...register('startTime')} />
        </div>
        <div>
          <Input label="Hora de Fin" type="time" error={errors.endTime?.message} {...register('endTime')} />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Recinto / Lugar"
            placeholder="Ej. Auditorio Nacional, Pepsi Center..."
            error={errors.venueName?.message}
            {...register('venueName')}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Dirección Completa"
            placeholder="Calle, número, colonia..."
            helperText="✨ Tip: Puedes escribir la dirección y ciudad aquí para que el mapa se ubique automáticamente, o arrastrar el pin en el mapa para autocompletar el texto."
            error={errors.address?.message}
            {...register('address')}
          />
        </div>

        <div>
          <Input label="Ciudad" placeholder="Ciudad de México" error={errors.city?.message} {...register('city')} />
        </div>
        <div>
          <Input label="Estado / Provincia" placeholder="CDMX" error={errors.state?.message} {...register('state')} />
        </div>

        {/* Mapa interactivo y Coordenadas GPS */}
        <div className="md:col-span-2 space-y-3">
          <LocationMapPicker
            latitude={watch('latitude')}
            longitude={watch('longitude')}
            venueName={watch('venueName')}
            address={watch('address')}
            city={watch('city')}
            state={watch('state')}
            addressQuery={[watch('address'), watch('city'), watch('state')].filter(Boolean).join(', ')}
            onCoordinatesChange={(lat, lng) => {
              setValue('latitude', lat, { shouldValidate: true, shouldDirty: true })
              setValue('longitude', lng, { shouldValidate: true, shouldDirty: true })
            }}
            onAddressResolved={(resolved) => {
              if (resolved.address) {
                setValue('address', resolved.address, { shouldValidate: true, shouldDirty: true })
              }
              if (resolved.city) {
                setValue('city', resolved.city, { shouldValidate: true, shouldDirty: true })
              }
              if (resolved.state) {
                setValue('state', resolved.state, { shouldValidate: true, shouldDirty: true })
              }
              if (resolved.venueName && !watch('venueName')) {
                setValue('venueName', resolved.venueName, { shouldValidate: true, shouldDirty: true })
              }
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitud"
              type="number"
              step="any"
              placeholder="19.4326"
              error={errors.latitude?.message}
              {...register('latitude', { valueAsNumber: true })}
            />
            <Input
              label="Longitud"
              type="number"
              step="any"
              placeholder="-99.1332"
              error={errors.longitude?.message}
              {...register('longitude', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#21262D]">
        <Button type="submit" variant="default" size="lg" isLoading={isLoading} className="gap-2 font-bold">
          Continuar a Secciones
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}
