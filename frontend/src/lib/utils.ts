import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseFloatSafe(val: string | number | boolean | null | undefined): number {
  if (typeof val === 'number') return val
  if (!val) return 0
  const s = val.toString().trim()
  
  if (s.includes(',')) {
    // If it has a comma, we assume Vietnamese format (dot for thousands, comma for decimal)
    // "1.234,56" -> "1234.56"
    const sanitized = s.replace(/\./g, "").replace(/,/g, ".")
    const parsed = parseFloat(sanitized)
    return isNaN(parsed) ? 0 : parsed
  }
  
  if (s.includes('.')) {
    const dotsCount = (s.match(/\./g) || []).length
    if (dotsCount > 1) {
      // Multiple dots: thousand separators (e.g., "1.000.000")
      return parseFloat(s.replace(/\./g, ""))
    }
    // Single dot: treat as decimal separator (standard JS/international)
    // "10.5" -> 10.5
    return parseFloat(s)
  }

  const parsed = parseFloat(s)
  return isNaN(parsed) ? 0 : parsed
}
