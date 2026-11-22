import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { API_BASE_URL } from '@/lib/axios'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFileUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const cleanBase = API_BASE_URL.replace(/\/+$/, '')
  const cleanPath = url.startsWith('/') ? url : `/${url}`
  return `${cleanBase}${cleanPath}`
}

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 0,
})

/** Formatea montos monetarios con separador de miles y 2 decimales (ej. $12,500.00). */
export function formatCurrency(amount?: number | null): string {
  const safe = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  return `$${currencyFormatter.format(safe)}`
}

/** Formatea montos sin el símbolo de moneda (ej. 12,500.00). */
export function formatAmount(amount?: number | null): string {
  const safe = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0
  return currencyFormatter.format(safe)
}

/** Formatea cantidades enteras con separador de miles (ej. 1,500). */
export function formatNumber(value?: number | null): string {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return integerFormatter.format(safe)
}
