import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Shield, CheckCircle, XCircle, Clock, Upload, X, FileText, AlertTriangle } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { validateCLABE, validateRFC, validateDocument } from '@/lib/validators/mexicoValidators'
import type { OrganizerMyVerificationResponse } from '@/types/api'

// ── Schema ─────────────────────────────────────────────────────────────────
const schema = z.object({
  legalName: z.string().min(3, 'Nombre legal requerido (mínimo 3 caracteres)'),
  taxId: z.string().min(12, 'RFC inválido (mínimo 12 caracteres)').max(13, 'RFC inválido (máximo 13 caracteres)'),
  clabeAccount: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

// ── Status banner config (adaptable dark & light) ──────────────────────────
const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    label: 'En revisión',
    description: 'Tu solicitud está siendo revisada por el equipo de Venú. Te notificaremos pronto.',
  },
  VERIFIED: {
    icon: CheckCircle,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    label: 'Verificado',
    description: 'Tu cuenta está verificada. ¡Tienes acceso completo para publicar eventos!',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    label: 'Rechazado',
    description: 'Tu solicitud fue rechazada. Corrige los datos señalados y vuelve a enviarla.',
  },
  UNVERIFIED: {
    icon: Shield,
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    label: 'Sin verificar',
    description: 'Aún no has solicitado tu verificación. Completa el formulario para comenzar.',
  },
}

// ── Drag-and-drop file zone ─────────────────────────────────────────────────
function FileDropZone({
  file,
  onChange,
  error,
}: {
  file: File | null
  onChange: (f: File | null) => void
  error?: string
}) {
  const [dragging, setDragging] = useState(false)

  const handle = useCallback(
    (f: File) => {
      const result = validateDocument(f)
      if (!result.valid) {
        alert(result.error)
        return
      }
      onChange(f)
    },
    [onChange]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handle(f)
  }

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handle(f)
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 border rounded-xl p-3 bg-emerald-500/10 border-emerald-500/30">
        <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</p>
          <p className="text-xs text-emerald-500 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-500 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors
        ${
          dragging
            ? 'border-[#FA4616] bg-[#FA4616]/10'
            : 'border-[var(--border-color)] hover:border-[#FA4616]/50 bg-[var(--bg-main)]'
        }`}
    >
      <Upload className={`w-7 h-7 ${dragging ? 'text-[#FA4616]' : 'text-[var(--text-secondary)]'}`} />
      <p className="text-sm text-[var(--text-primary)] text-center">
        <span className="font-semibold text-[#FA4616]">Haz clic</span> o arrastra tu archivo aquí
      </p>
      <p className="text-xs text-[var(--text-secondary)]">PDF, JPG o PNG · máx. 10 MB</p>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={onInput} />
    </label>
  )
}

// ── Validated input with inline feedback ───────────────────────────────────
function ValidatedInput({
  label,
  error,
  hint,
  success,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  success?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[var(--text-primary)]">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-500 flex items-center gap-1 font-medium">✕ {error}</p>}
      {success && <p className="text-xs text-emerald-500 flex items-center gap-1 font-medium">✓ {success}</p>}
      {hint && !error && !success && <p className="text-xs text-[var(--text-secondary)]">{hint}</p>}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function VerificationRequestPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [submitted, setSubmitted] = useState(false)
  const [docFile, setDocFile] = useState<File | null>(null)
  const [rfcState, setRfcState] = useState<{ valid?: boolean; msg?: string }>({})
  const [clabeState, setClabeState] = useState<{ valid?: boolean; msg?: string }>({})

  // Consultar estado actual del organizador desde la API
  const { data: verificationData, isLoading } = useQuery<OrganizerMyVerificationResponse>({
    queryKey: ['my-verification'],
    queryFn: async () => {
      const res = await apiClient.get<OrganizerMyVerificationResponse>('/api/organizers/me/verification')
      return res.data
    },
  })

  const hasVerification = Boolean(verificationData?.verification)
  const rawStatus = verificationData?.status

  // Si no tiene registro de verificación y no está en VERIFIED o REJECTED, el estado real es UNVERIFIED
  const status: keyof typeof STATUS_CONFIG = (() => {
    if (isLoading && !verificationData) return 'UNVERIFIED'
    if (rawStatus === 'VERIFIED') return 'VERIFIED'
    if (rawStatus === 'REJECTED') return 'REJECTED'
    if (rawStatus === 'PENDING' && hasVerification) return 'PENDING'
    return 'UNVERIFIED'
  })()

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNVERIFIED
  const Icon = cfg.icon
  const canSubmit = status === 'UNVERIFIED' || status === 'REJECTED' || !hasVerification

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  // Pre-llenar valores previos si existen
  useEffect(() => {
    if (verificationData?.verification) {
      if (verificationData.verification.legalName) {
        setValue('legalName', verificationData.verification.legalName)
      }
      if (verificationData.verification.taxId) {
        setValue('taxId', verificationData.verification.taxId)
        const res = validateRFC(verificationData.verification.taxId)
        if (res.valid) {
          setRfcState({ valid: true, msg: res.type === 'moral' ? 'RFC persona moral ✓' : 'RFC persona física ✓' })
        }
      }
      if (verificationData.verification.clabeAccount) {
        setValue('clabeAccount', verificationData.verification.clabeAccount)
        const res = validateCLABE(verificationData.verification.clabeAccount)
        if (res.valid) {
          setClabeState({ valid: true, msg: 'CLABE válida ✓' })
        }
      }
    }
  }, [verificationData, setValue])

  // ── Inline RFC validation ──
  const handleRfcBlur = () => {
    const val = getValues('taxId')
    if (!val) {
      setRfcState({})
      return
    }
    const res = validateRFC(val)
    setRfcState(
      res.valid
        ? { valid: true, msg: res.type === 'moral' ? 'RFC persona moral ✓' : 'RFC persona física ✓' }
        : { valid: false, msg: res.error }
    )
  }

  // ── Inline CLABE validation ──
  const handleClabeBlur = () => {
    const val = getValues('clabeAccount')
    if (!val) {
      setClabeState({})
      return
    }
    const res = validateCLABE(val)
    setClabeState(
      res.valid ? { valid: true, msg: 'CLABE válida ✓' } : { valid: false, msg: res.error }
    )
  }

  // ── Submit ──
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Guard: validar inline
      const rfcCheck = validateRFC(data.taxId)
      if (!rfcCheck.valid) {
        setRfcState({ valid: false, msg: rfcCheck.error })
        throw new Error(rfcCheck.error || 'RFC inválido')
      }

      if (data.clabeAccount && data.clabeAccount.trim() !== '') {
        const clabeCheck = validateCLABE(data.clabeAccount)
        if (!clabeCheck.valid) {
          setClabeState({ valid: false, msg: clabeCheck.error })
          throw new Error(clabeCheck.error || 'CLABE inválida')
        }
      }

      const form = new FormData()
      form.append('legalName', data.legalName)
      form.append('taxId', data.taxId.toUpperCase().trim())
      if (data.clabeAccount) form.append('clabeAccount', data.clabeAccount.trim())
      if (docFile) form.append('companyDocument', docFile)

      await apiClient.post('/api/organizers/me/verification', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      setSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ['my-verification'] })
    },
  })

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-6 h-6 text-[#FA4616]" />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Verificación de cuenta
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          La verificación desbloquea la publicación de eventos y aumenta la confianza de tus asistentes.
        </p>
      </div>

      {/* Status banner */}
      <div className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border ${cfg.color} transition-all`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">Estado actual: {cfg.label}</p>
          <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{cfg.description}</p>

          {/* Mostrar motivo de rechazo si existe */}
          {status === 'REJECTED' && verificationData?.verification?.rejectionReason && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
              <span className="font-semibold block mb-0.5 text-rose-500">Motivo del rechazo:</span>
              <p className="text-[var(--text-primary)]">{verificationData.verification.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Success message */}
      {submitted && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-emerald-500 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Solicitud enviada correctamente</p>
            <p className="text-xs mt-0.5 opacity-90">
              El equipo de Venú revisará tus documentos en 1–3 días hábiles. Te notificaremos en cuanto haya una actualización.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      {canSubmit && !submitted && (
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-5 shadow-sm"
        >
          <div className="border-b border-[var(--border-color)] pb-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Datos para verificación KYC
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Ingresa los datos fiscales y corporativos de tu persona física o moral.
            </p>
          </div>

          {/* Nombre legal */}
          <ValidatedInput
            label="Nombre legal / Razón social"
            required
            error={errors.legalName?.message}
          >
            <input
              {...register('legalName')}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#FA4616] focus:ring-1 focus:ring-[#FA4616] transition"
              placeholder="Ej. Eventos Norteños S.A. de C.V."
            />
          </ValidatedInput>

          {/* RFC */}
          <ValidatedInput
            label="RFC"
            required
            error={rfcState.valid === false ? rfcState.msg : errors.taxId?.message}
            success={rfcState.valid ? rfcState.msg : undefined}
            hint="12 caracteres para persona moral, 13 para persona física"
          >
            <input
              {...register('taxId')}
              onBlur={handleRfcBlur}
              onChange={(e) => {
                register('taxId').onChange(e)
                setRfcState({})
              }}
              className={`w-full uppercase font-mono rounded-xl border bg-[var(--bg-main)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition
                ${
                  rfcState.valid === false
                    ? 'border-rose-400 focus:ring-1 focus:ring-rose-400'
                    : rfcState.valid
                    ? 'border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                    : 'border-[var(--border-color)] focus:border-[#FA4616] focus:ring-1 focus:ring-[#FA4616]'
                }`}
              placeholder="Ej. ENOR920101ABC"
              maxLength={13}
            />
          </ValidatedInput>

          {/* CLABE */}
          <ValidatedInput
            label="CLABE interbancaria (18 dígitos)"
            error={clabeState.valid === false ? clabeState.msg : undefined}
            success={clabeState.valid ? clabeState.msg : undefined}
            hint="Se verificará con el algoritmo oficial de BANXICO"
          >
            <input
              {...register('clabeAccount')}
              onBlur={handleClabeBlur}
              onChange={(e) => {
                register('clabeAccount').onChange(e)
                setClabeState({})
              }}
              className={`w-full font-mono rounded-xl border bg-[var(--bg-main)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition
                ${
                  clabeState.valid === false
                    ? 'border-rose-400 focus:ring-1 focus:ring-rose-400'
                    : clabeState.valid
                    ? 'border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                    : 'border-[var(--border-color)] focus:border-[#FA4616] focus:ring-1 focus:ring-[#FA4616]'
                }`}
              placeholder="Ej. 032180000118359719"
              maxLength={18}
            />
          </ValidatedInput>

          {/* Documento con FileDropZone */}
          <ValidatedInput label="Acta constitutiva / documento empresarial (opcional)">
            <FileDropZone file={docFile} onChange={setDocFile} />
          </ValidatedInput>

          {mutation.isError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
              Error al enviar la solicitud: {mutation.error?.message || 'Inténtalo de nuevo.'}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-[#FA4616] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#e03d12] transition disabled:opacity-60 shadow-md shadow-[#FA4616]/20 cursor-pointer"
          >
            {mutation.isPending ? 'Enviando solicitud...' : 'Enviar solicitud de verificación'}
          </button>
        </form>
      )}
    </div>
  )
}
