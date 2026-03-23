import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseFloatSafe(val: string | number | boolean | null | undefined): number {
  if (typeof val === 'number') return val
  if (!val) return 0
  const s = val.toString().trim()
  
  // Remove all dots (thousands separator)
  // And replace comma with dot (decimal separator)
  const sanitized = s.replace(/\./g, "").replace(/,/g, ".")
  const parsed = parseFloat(sanitized)
  return isNaN(parsed) ? 0 : parsed
}

export function formatNumberVN(val: number): string {
  if (isNaN(val)) return "0"
  if (val === 0) return ""
  
  const parts = val.toString().split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return parts.join(",")
}
