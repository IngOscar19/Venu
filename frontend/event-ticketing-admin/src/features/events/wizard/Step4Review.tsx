import { Button } from '@/components/ui/Button'
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import type { Step1FormValues } from './Step1General'
import type { WizardSectionItem } from './Step2Sections'

interface Step4ReviewProps {
  generalData: Step1FormValues
  sections: WizardSectionItem[]
  hasPoster: boolean
  isSubmitting?: boolean
  isEditMode?: boolean
  onBack: () => void
  onSaveDraft: () => void
  onPublish: () => void
}

export function Step4Review({
  generalData,
  sections,
  hasPoster,
  isSubmitting = false,
  isEditMode = false,
  onBack,
  onSaveDraft,
  onPublish,
}: Step4ReviewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-[#FA4616]/15 text-[#FA4616] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#FA4616]/30">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#F0F6FC] font-headline">
          {isEditMode ? '¡Revisa los cambios de tu evento!' : '¡Tu evento está listo para publicarse!'}
        </h2>
        <p className="text-xs text-[#8B949E] mt-1 max-w-md mx-auto">
          {isEditMode
            ? 'Confirma que la información modificada sea correcta antes de guardar definitivamente.'
            : 'Revisa el resumen de la información antes de publicarlo o guárdalo como borrador.'}
        </p>
      </div>

      <div className="bg-[#0D1117] p-5 rounded-2xl border border-[#30363D] text-xs space-y-3 font-mono">
        <div className="flex justify-between items-center py-1.5 border-b border-[#21262D]">
          <span className="text-[#8B949E]">Nombre del evento:</span>
          <span className="font-semibold text-[#F0F6FC]">{generalData.name}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-[#21262D]">
          <span className="text-[#8B949E]">Recinto y Ciudad:</span>
          <span className="font-semibold text-[#F0F6FC]">{generalData.venueName}, {generalData.city}</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-[#21262D]">
          <span className="text-[#8B949E]">Horario:</span>
          <span className="font-semibold text-[#F0F6FC]">
            {generalData.startDate} • {generalData.startTime} a {generalData.endTime} hrs
          </span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-[#21262D]">
          <span className="text-[#8B949E]">Aforo total:</span>
          <span className="font-semibold text-[#F0F6FC]">{generalData.capacity.toLocaleString()} personas</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-[#21262D]">
          <span className="text-[#8B949E]">Secciones:</span>
          <span className="font-semibold text-[#F5A894]">{sections.length} secciones configuradas</span>
        </div>
        <div className="flex justify-between items-center py-1.5">
          <span className="text-[#8B949E]">Portada cargada:</span>
          <span className={`font-semibold ${hasPoster ? 'text-emerald-400' : 'text-[#8B949E]'}`}>
            {hasPoster ? 'Sí' : 'No'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#21262D]">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </Button>
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <Button
              variant="default"
              size="lg"
              onClick={onSaveDraft}
              isLoading={isSubmitting}
              className="gap-2 font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar y Finalizar Edición
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onSaveDraft} disabled={isSubmitting}>
                Guardar Borrador
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={onPublish}
                isLoading={isSubmitting}
                className="font-bold"
              >
                Publicar Ahora
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
