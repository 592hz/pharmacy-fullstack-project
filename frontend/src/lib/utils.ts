import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseFloatSafe(val: any): number {
  if (typeof val === 'number') return val
  if (!val) return 0
  const sanitized = val.toString().replace(/\./g, "").replace(/,/g, ".")
  const parsed = parseFloat(sanitized)
  return isNaN(parsed) ? 0 : parsed
}
