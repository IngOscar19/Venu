import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '../hooks/useLogin'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertCircle, Lock, Mail } from 'lucide-react'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe contener al menos 6 caracteres'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { mutate: login, isPending } = useLogin()
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    login(values, {
      onSuccess: () => {
        onSuccess?.()
      },
    })
  }

  return (
    <div className="w-full">
      {/* 401 / Auth Error Alert */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-300 leading-relaxed font-mono">
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="admin@eventticketing.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Mail className="absolute right-3.5 top-9 h-4 w-4 text-[#6E7681] pointer-events-none" />
        </div>

        <div className="relative">
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Lock className="absolute right-3.5 top-9 h-4 w-4 text-[#6E7681] pointer-events-none" />
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full mt-2 font-bold uppercase tracking-wider text-xs h-11 shadow-lg shadow-[#FA4616]/25"
          isLoading={isPending}
        >
          Iniciar Sesión
        </Button>
      </form>
    </div>
  )
}
