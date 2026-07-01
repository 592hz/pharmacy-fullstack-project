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

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === "string") return error
    if (error && typeof error === "object" && "message" in error) {
        return String(error.message)
    }
    return "Đã xảy ra lỗi không xác định"
}

export function parseExpiryDate(dateStr: string | undefined): number {
    if (!dateStr) return Infinity; // Không có hạn dùng => ưu tiên dùng sau hoặc để cuối
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day).getTime();
    }
    return Infinity;
}

export function sortBatchesFEFO<T extends { expiryDate?: string }>(batches: T[]): T[] {
    return [...batches].sort((a, b) => {
        return parseExpiryDate(a.expiryDate) - parseExpiryDate(b.expiryDate);
    });
}

export function formatDateInput(value: string): string {
    let val = value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);
    
    let formatted = val;
    if (val.length >= 5) {
        formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length >= 3) {
        formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    return formatted;
}

export function formatDateTimeInput(value: string): string {
    let val = value.replace(/\D/g, "");
    if (val.length > 12) val = val.slice(0, 12);
    
    let formatted = val;
    // Format: DD/MM/YYYY HH:mm
    if (val.length >= 11) {
        formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)} ${val.slice(8, 10)}:${val.slice(10)}`;
    } else if (val.length >= 9) {
        formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)} ${val.slice(8)}`;
    } else if (val.length >= 5) {
        formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length >= 3) {
        formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    return formatted;
}
