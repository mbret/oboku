import { useEffect, useState } from "react"

/**
 * @important
 * Be careful when using this method as it can creates an infinite loop.
 * Because it always setState after the delay for a given state, the given state
 * needs to be stable at some points.
 */
export function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Create a timeout to update the debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if the value changes before the delay has passed
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
