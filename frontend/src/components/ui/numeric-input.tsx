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
      value === 0 ? "" : value.toString()
    )

    // Use a secondary state to track the previous prop value for synchronization
    const [prevValue, setPrevValue] = useState(value)

    if (value !== prevValue) {
      setPrevValue(value)
      setLocalValue(formatNumberVN(value))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      // Allow numbers, dots and commas
      if (val === "" || /^[0-9.,]*$/.test(val)) {
        setLocalValue(val)
        if (onChange) {
          // parseFloatSafe now handles dot as thousands and comma as decimal
          onChange(parseFloatSafe(val))
        }
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
