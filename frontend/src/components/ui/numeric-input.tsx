import * as React from "react"
import { useState } from "react"
import { parseFloatSafe, formatNumberVN } from "@/lib/utils"
import { cn } from "@/lib/utils"

export interface NumericInputProps extends Omit<React.ComponentProps<"input">, 'onChange' | 'value'> {
  value: number
  onChange?: (value: number) => void
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [localValue, setLocalValue] = useState<string>(
      value === 0 ? "" : formatNumberVN(value)
    )

    // Use a secondary state to track the previous prop value for synchronization
    const [prevValue, setPrevValue] = useState(value)

    if (value !== prevValue) {
      setPrevValue(value)
      setLocalValue(formatNumberVN(value))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      const rawVal = input.value

      if (rawVal === "") {
        setLocalValue("")
        if (onChange) onChange(0)
        return
      }

      // Allow numbers, dots and commas
      if (/^[0-9.,]*$/.test(rawVal)) {
        const selectionStart = input.selectionStart || 0
        const valBeforeCursor = rawVal.substring(0, selectionStart)
        const digitsBeforeCursor = valBeforeCursor.replace(/[^0-9]/g, "").length

        const numericValue = parseFloatSafe(rawVal)
        const endsWithComma = rawVal.endsWith(",")
        const hasComma = rawVal.includes(",")

        let formatted = formatNumberVN(numericValue)
        if (endsWithComma) {
          formatted = formatted + ","
        } else if (hasComma) {
          const valParts = rawVal.split(",")
          const integerPart = parseFloatSafe(valParts[0])
          formatted = formatNumberVN(integerPart) + "," + valParts.slice(1).join("")
        }

        setLocalValue(formatted)
        if (onChange) {
          onChange(numericValue)
        }

        // Restore cursor position
        setTimeout(() => {
          if (!input) return
          let newSelectionStart = 0
          let digitCount = 0
          for (let i = 0; i < formatted.length; i++) {
            if (digitCount === digitsBeforeCursor) {
              break
            }
            newSelectionStart++
            if (/[0-9]/.test(formatted[i])) {
              digitCount++
            }
          }
          input.setSelectionRange(newSelectionStart, newSelectionStart)
        }, 0)
      }
    }

    return (
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleChange}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
          className
        )}
      />
    )
  }
)
NumericInput.displayName = "NumericInput"

export { NumericInput }
