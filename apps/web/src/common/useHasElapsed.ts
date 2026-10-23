import { useEffect, useState } from "react"
import { scheduleDelayedEffect } from "./useDelayEffect"

/**
 * Whether `delay` milliseconds have passed since the component mounted. A new
 * `delay` counts from the render that gives it. `true` from the first render
 * when `delay` is 0 or less.
 */
export const useHasElapsed = (delay: number) => {
  const [hasElapsed, setHasElapsed] = useState(delay <= 0)

  useEffect(
    function markElapsedAfterDelay() {
      return scheduleDelayedEffect(function markElapsed() {
        setHasElapsed(true)
      }, delay)
    },
    [delay],
  )

  return hasElapsed
}
