// Validación CLABE bancaria — Algoritmo oficial BANXICO
export function validateCLABE(clabe: string): { valid: boolean; error?: string } {
  const clean = clabe.replace(/\s/g, '')
  if (!/^\d{18}$/.test(clean)) return { valid: false, error: 'La CLABE debe tener exactamente 18 dígitos' }

  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7]
  const digits = clean.split('').map(Number)
  const sum = weights.reduce((acc, w, i) => acc + ((w * digits[i]) % 10), 0)
  const control = (10 - (sum % 10)) % 10

  if (control !== digits[17]) return { valid: false, error: 'CLABE inválida (dígito verificador incorrecto)' }
  return { valid: true }
}

// Validación RFC — Reglas estructurales del SAT
export function validateRFC(rfc: string): { valid: boolean; type?: 'moral' | 'fisica'; error?: string } {
  const clean = rfc.trim().toUpperCase()
  // Persona moral: 3 letras + 6 dígitos fecha + 3 alfanuméricos
  const moral = /^[A-ZÑ&]{3}\d{6}[A-Z\d]{3}$/.test(clean)
  // Persona física: 4 letras + 6 dígitos fecha + 3 alfanuméricos
  const fisica = /^[A-ZÑ&]{4}\d{6}[A-Z\d]{3}$/.test(clean)

  if (!moral && !fisica) {
    if (clean.length < 12) return { valid: false, error: 'RFC demasiado corto (mín. 12 caracteres)' }
    if (clean.length > 13) return { valid: false, error: 'RFC demasiado largo (máx. 13 caracteres)' }
    return { valid: false, error: 'Formato de RFC inválido' }
  }

  // Validar que la fecha en el RFC sea real
  const dateStr = clean.slice(moral ? 3 : 4, moral ? 9 : 10)
  const month = parseInt(dateStr.slice(2, 4))
  const day = parseInt(dateStr.slice(4, 6))
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, error: 'La fecha en el RFC no es válida' }
  }

  return { valid: true, type: moral ? 'moral' : 'fisica' }
}

// Validar tipo de archivo permitido
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_SIZE_MB = 10

export function validateDocument(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    return { valid: false, error: 'Solo se permiten PDF, JPG o PNG' }
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `El archivo no debe superar ${MAX_FILE_SIZE_MB} MB` }
  }
  return { valid: true }
}
