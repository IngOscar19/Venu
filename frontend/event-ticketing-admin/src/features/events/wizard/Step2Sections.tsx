import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react'

export interface WizardSectionItem {
  name: string
  description?: string
  capacity: number
  basePrice: number
}

interface Step2SectionsProps {
  sections: WizardSectionItem[]
  maxCapacity: number
  onAddSection: (section: WizardSectionItem) => void
  onRemoveSection: (index: number) => void
  onNext: () => void
  onBack: () => void
}

export function Step2Sections({
  sections,
  maxCapacity,
  onAddSection,
  onRemoveSection,
  onNext,
  onBack,
}: Step2SectionsProps) {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  const currentCapacity = sections.reduce((sum, s) => sum + (s.capacity || 0), 0)

  const handleAdd = () => {
    setError(null)
    if (!name.trim() || !capacity || !price) {
      setError('Todos los campos son obligatorios.')
      return
    }

    const capNum = parseInt(capacity)
    const priceNum = parseFloat(price)

    if (isNaN(capNum) || isNaN(priceNum) || capNum <= 0 || priceNum <= 0) {
      setError('La capacidad y el precio deben ser mayores a 0.')
      return
    }

    if (currentCapacity + capNum > maxCapacity) {
      setError(`La capacidad acumulada (${currentCapacity + capNum}) supera el aforo total (${maxCapacity}).`)
      return
    }

    onAddSection({
      name: name.trim(),
      capacity: capNum,
      basePrice: priceNum,
    })

    setName('')
    setCapacity('')
    setPrice('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#F0F6FC] font-headline">Secciones y Precios de Boletos</h2>
          <p className="text-xs text-[#8B949E] mt-0.5">Configura las áreas del evento con su respectivo aforo y costo.</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono text-[#8B949E] block">Capacidad asignada:</span>
          <span className={`text-xs font-mono font-bold ${currentCapacity > maxCapacity ? 'text-rose-400' : 'text-[#F5A894]'}`}>
            {currentCapacity} / {maxCapacity}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-medium rounded-xl">
          {error}
        </div>
      )}

      {/* Sections list */}
      <div className="divide-y divide-[#21262D] border border-[#30363D] rounded-xl overflow-hidden bg-[#0D1117]">
        {sections.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8B949E]">
            Aún no has agregado ninguna sección. Agrega al menos una sección para continuar.
          </div>
        ) : (
          sections.map((s, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-[#161B22] transition-colors">
              <div>
                <h4 className="font-semibold text-xs text-[#F0F6FC]">{s.name}</h4>
                <p className="text-[11px] font-mono text-[#8B949E]">{(s.capacity ?? 0).toLocaleString()} boletos disponibles</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono font-bold text-[#F5A894]">${(s.basePrice ?? 0).toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSection(idx)}
                  className="p-1.5 text-[#8B949E] hover:text-rose-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Section Box */}
      <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-3">
        <h3 className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#8B949E]">
          Nueva Sección
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Nombre (ej. VIP, General)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Capacidad"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <Input
            placeholder="Precio ($)"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          className="gap-1.5 font-semibold text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar Sección
        </Button>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#21262D]">
        <Button variant="secondary" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={onNext}
          disabled={sections.length === 0}
          className="gap-2 font-bold"
        >
          Continuar a Multimedia
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
