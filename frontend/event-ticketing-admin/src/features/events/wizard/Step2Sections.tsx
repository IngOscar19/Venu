import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, ArrowRight, Plus, Trash2, Pencil, Check, X, Layers, Ticket, AlertCircle } from 'lucide-react'

export interface WizardSectionItem {
  id?: string
  name: string
  description?: string
  capacity: number
  basePrice: number
}

interface Step2SectionsProps {
  sections: WizardSectionItem[]
  maxCapacity: number
  onAddSection: (section: WizardSectionItem) => Promise<void> | void
  onUpdateSection?: (index: number, section: WizardSectionItem) => Promise<void> | void
  onRemoveSection: (index: number) => Promise<void> | void
  onNext: () => void
  onBack: () => void
  isEditMode?: boolean
}

export function Step2Sections({
  sections,
  maxCapacity,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onNext,
  onBack,
  isEditMode = false,
}: Step2SectionsProps) {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  const currentCapacity = sections.reduce((sum, s) => sum + (s.capacity || 0), 0)
  const editingOldCap = editingIdx !== null ? sections[editingIdx]?.capacity || 0 : 0
  const availableCapacity = Math.max(0, maxCapacity - (editingIdx !== null ? currentCapacity - editingOldCap : currentCapacity))

  const handleStartEdit = (idx: number) => {
    const sec = sections[idx]
    if (!sec) return
    setError(null)
    setEditingIdx(idx)
    setName(sec.name)
    setCapacity(sec.capacity?.toString() || '')
    setPrice(sec.basePrice?.toString() || '')
  }

  const handleCancelEdit = () => {
    setEditingIdx(null)
    setName('')
    setCapacity('')
    setPrice('')
    setError(null)
  }

  const handleSubmitSection = async () => {
    setError(null)
    if (!name.trim() || !capacity || !price) {
      setError('Por favor completa los 3 campos: Nombre, Capacidad y Precio.')
      return
    }

    const capNum = parseInt(capacity)
    const priceNum = parseFloat(price)

    if (isNaN(capNum) || isNaN(priceNum) || capNum <= 0 || priceNum <= 0) {
      setError('La capacidad y el precio deben ser valores numéricos mayores a 0.')
      return
    }

    if (editingIdx !== null) {
      // Editing existing section
      const oldCap = sections[editingIdx]?.capacity || 0
      const newTotal = currentCapacity - oldCap + capNum
      if (newTotal > maxCapacity) {
        setError(`La capacidad total (${newTotal}) supera el aforo máximo del evento (${maxCapacity}).`)
        return
      }

      setIsSubmittingForm(true)
      try {
        const targetSection = sections[editingIdx]
        const updatedItem: WizardSectionItem = {
          ...targetSection,
          name: name.trim(),
          capacity: capNum,
          basePrice: priceNum,
        }

        if (onUpdateSection) {
          await onUpdateSection(editingIdx, updatedItem)
        }
        handleCancelEdit()
      } catch (err: any) {
        setError(err?.message || 'Error al actualizar la sección.')
      } finally {
        setIsSubmittingForm(false)
      }
    } else {
      // Adding new section
      if (currentCapacity + capNum > maxCapacity) {
        setError(`La capacidad acumulada (${currentCapacity + capNum}) supera el aforo total del evento (${maxCapacity}).`)
        return
      }

      setIsSubmittingForm(true)
      try {
        await onAddSection({
          name: name.trim(),
          capacity: capNum,
          basePrice: priceNum,
        })

        setName('')
        setCapacity('')
        setPrice('')
      } catch (err: any) {
        setError(err?.message || 'Error al agregar la sección.')
      } finally {
        setIsSubmittingForm(false)
      }
    }
  }

  const handleRemove = async (idx: number) => {
    setError(null)
    if (editingIdx === idx) {
      handleCancelEdit()
    }
    setDeletingIdx(idx)
    try {
      await onRemoveSection(idx)
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar la sección.')
    } finally {
      setDeletingIdx(null)
    }
  }

  const handleNextWithCheck = () => {
    if (name.trim() || capacity || price) {
      setError('Tienes datos escritos en el formulario. Haz clic en el botón naranja "+ Agregar Sección" para registrarla antes de continuar.')
      return
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Header and Capacity Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-base font-bold text-[#F0F6FC] font-headline flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#FA4616]" />
            Secciones y Precios de Boletos
          </h2>
          <p className="text-xs text-[#8B949E] mt-0.5">
            Configura las zonas de tu evento con su aforo de boletos y precio de venta.
          </p>
        </div>

        {/* Visual Capacity Pill / Progress */}
        <div className="bg-[#161B22] border border-[#30363D] px-4 py-2.5 rounded-xl flex items-center gap-3 shrink-0 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-[#FA4616]/15 border border-[#FA4616]/30 flex items-center justify-center text-[#FA4616]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#8B949E]">Aforo asignado:</span>
              <span className={`font-bold ${currentCapacity > maxCapacity ? 'text-rose-400' : 'text-[#FA4616]'}`}>
                {currentCapacity.toLocaleString()} / {maxCapacity.toLocaleString()}
              </span>
            </div>
            <div className="w-36 h-1.5 bg-[#21262D] rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  currentCapacity > maxCapacity ? 'bg-rose-500' : 'bg-[#FA4616]'
                }`}
                style={{ width: `${Math.min(100, (currentCapacity / maxCapacity) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-medium rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulario de Agregar / Editar Sección */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          editingIdx !== null
            ? 'bg-[#161B22] border-[#FA4616]/60 shadow-lg shadow-[#FA4616]/10 ring-1 ring-[#FA4616]/30'
            : 'bg-[#161B22]/90 border-[#30363D] hover:border-[#484F58]'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#30363D]/60">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${editingIdx !== null ? 'bg-[#FA4616]/20 text-[#FA4616]' : 'bg-[#FA4616] text-white'}`}>
              {editingIdx !== null ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#F0F6FC] uppercase tracking-wider font-mono">
                {editingIdx !== null ? `Editando Sección: ${sections[editingIdx]?.name}` : 'Nueva Sección'}
              </h3>
              <p className="text-[11px] text-[#8B949E]">
                {editingIdx !== null
                  ? 'Modifica los valores y presiona "Guardar Cambios".'
                  : 'Ingresa los datos de la zona y haz clic en "Agregar Sección".'}
              </p>
            </div>
          </div>

          {editingIdx !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs font-mono text-[#8B949E] hover:text-[#F0F6FC] px-2.5 py-1 rounded-lg border border-[#30363D] hover:bg-[#21262D] transition-colors inline-flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar edición
            </button>
          )}
        </div>

        {/* Inputs ordenados con etiquetas claras */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
          <div className="md:col-span-5">
            <Input
              label="1. Nombre de la Sección"
              placeholder="Ej. General, VIP, Grada A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitSection()}
              disabled={isSubmittingForm}
              helperText="Nombre identificador de la zona"
            />
          </div>

          <div className="md:col-span-3">
            <Input
              label="2. Boletos (Capacidad)"
              type="number"
              min="1"
              placeholder="Ej. 100"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitSection()}
              disabled={isSubmittingForm}
              helperText={`Disponible: ${availableCapacity.toLocaleString()} boletos`}
            />
          </div>

          <div className="md:col-span-4">
            <Input
              label="3. Precio por Boleto ($)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej. 450.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitSection()}
              disabled={isSubmittingForm}
              helperText="Precio en MXN por asistente"
            />
          </div>
        </div>

        {/* Botón de acción principal destacado */}
        <div className="pt-4 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#30363D]/40">
          <span className="text-[11px] text-[#8B949E] font-mono">
            💡 Presiona <kbd className="px-1.5 py-0.5 rounded bg-[#21262D] text-[#C9D1D9] border border-[#30363D]">Enter</kbd> o haz clic en el botón naranja para añadirla.
          </span>

          {editingIdx !== null ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handleSubmitSection}
                isLoading={isSubmittingForm}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 px-5 text-xs shadow-md shadow-emerald-600/20"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Guardar Cambios
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="default"
                onClick={handleCancelEdit}
                disabled={isSubmittingForm}
                className="h-10 px-4 text-xs"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={handleSubmitSection}
              isLoading={isSubmittingForm}
              className="bg-[#FA4616] hover:bg-[#ff5c2e] text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-[#FA4616]/30 text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Agregar Sección</span>
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Secciones Agregadas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
            <span>Secciones Configuradas</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#21262D] text-[#F0F6FC]">
              {sections.length}
            </span>
          </h3>
          {sections.length > 0 && (
            <span className="text-[11px] font-mono text-[#8B949E]">
              Total estimado: ${(sections.reduce((acc, s) => acc + (s.capacity * s.basePrice), 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
            </span>
          )}
        </div>

        <div className="divide-y divide-[#21262D] border border-[#30363D] rounded-2xl overflow-hidden bg-[#0D1117] shadow-sm">
          {sections.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#161B22] border border-[#30363D] mx-auto flex items-center justify-center text-[#8B949E]">
                <Ticket className="w-5 h-5 text-[#FA4616]/60" />
              </div>
              <p className="text-xs text-[#F0F6FC] font-semibold">Aún no has agregado ninguna sección</p>
              <p className="text-[11px] text-[#8B949E] max-w-sm mx-auto">
                Llena el formulario de arriba con el nombre, boletos y precio, luego haz clic en el botón naranja <strong>"Agregar Sección"</strong>.
              </p>
            </div>
          ) : (
            sections.map((s, idx) => {
              const isBeingEdited = editingIdx === idx
              const subtotal = (s.capacity || 0) * (s.basePrice || 0)

              return (
                <div
                  key={s.id || idx}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    isBeingEdited ? 'bg-[#FA4616]/10 border-l-4 border-l-[#FA4616]' : 'hover:bg-[#161B22]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#21262D] border border-[#30363D] flex items-center justify-center text-[#FA4616] font-mono text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#F0F6FC] truncate">{s.name}</h4>
                        {isBeingEdited && (
                          <span className="text-[9px] font-mono font-bold bg-[#FA4616]/20 text-[#FA4616] px-1.5 py-0.5 rounded">
                            Editando
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] font-mono text-[#8B949E]">
                        <span>{(s.capacity ?? 0).toLocaleString()} boletos</span>
                        <span>•</span>
                        <span>Subtotal: ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-mono font-bold text-[#F5A894]">
                      ${(s.basePrice ?? 0).toFixed(2)}
                      <span className="text-[10px] text-[#8B949E] font-normal ml-1">MXN</span>
                    </span>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx)}
                      disabled={isSubmittingForm || deletingIdx !== null}
                      className="p-2 text-[#8B949E] hover:text-[#FA4616] hover:bg-[#21262D] disabled:opacity-50 rounded-xl transition-colors border border-transparent hover:border-[#30363D]"
                      title="Editar sección"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      disabled={deletingIdx === idx || isSubmittingForm}
                      onClick={() => handleRemove(idx)}
                      className="p-2 text-[#8B949E] hover:text-rose-400 hover:bg-[#21262D] disabled:opacity-50 rounded-xl transition-colors border border-transparent hover:border-rose-900/50"
                      title="Eliminar sección"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Navegación del Wizard */}
      <div className="flex items-center justify-between pt-4 border-t border-[#21262D]">
        <Button variant="secondary" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={handleNextWithCheck}
          disabled={sections.length === 0}
          className="gap-2 font-bold shadow-lg shadow-[#FA4616]/25"
        >
          Continuar a Multimedia
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
