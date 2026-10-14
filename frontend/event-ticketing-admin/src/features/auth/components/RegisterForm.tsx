import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRegister } from '../hooks/useRegister'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertCircle, Lock, Mail, User, Building } from 'lucide-react'

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'El nombre es obligatorio'),
    lastName: z.string().min(1, 'El apellido es obligatorio'),
    organizerName: z.string().min(1, 'El nombre de la organización o marca es obligatorio'),
    email: z
      .string()
      .min(1, 'El correo electrónico es requerido')
      .email('Ingresa un correo electrónico válido'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { mutate: registerUser, isPending } = useRegister()
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      firstName: '',
      lastName: '',
      organizerName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (values: RegisterFormValues) => {
    registerUser(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        organizerName: values.organizerName,
        email: values.email,
        password: values.password,
        role: 'ORGANIZER',
      },
      {
        onSuccess: () => {
          onSuccess?.()
        },
      }
    )
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-300 leading-relaxed font-mono">
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Input
              label="Nombre"
              placeholder="Juan"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <User className="absolute right-3.5 top-9 h-4 w-4 text-[#6E7681] pointer-events-none" />
          </div>

          <div className="relative">
            <Input
              label="Apellido"
              placeholder="Pérez"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
            <User className="absolute right-3.5 top-9 h-4 w-4 text-[#6E7681] pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <Input
            label="Organización o Productora"
            placeholder="ej. Venú Live, Producciones Luna"
            error={errors.organizerName?.message}
            {...register('organizerName')}
          />
          <Building className="absolute right-3.5 top-9 h-4 w-4 text-[#6E7681] pointer-events-none" />
        </div>

        <div className="relative">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="organizador@empresa.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Mail className="absolute right-3.5 top-9 h-4 w-4 text-[#6E7681] pointer-events-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Lock className="absolute right-3.5 top-9 h-4 w-4 text-[#6E7681] pointer-events-none" />
          </div>

          <div className="relative">
            <Input
              label="Confirmar"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Lock className="absolute right-3.5 top-9 h-4 w-4 text-[#6E7681] pointer-events-none" />
          </div>
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full mt-3 font-bold uppercase tracking-wider text-xs h-11 shadow-lg shadow-[#FA4616]/25"
          isLoading={isPending}
        >
          Crear Cuenta de Organizador
        </Button>
      </form>
    </div>
  )
}
