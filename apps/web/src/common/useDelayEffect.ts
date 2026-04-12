import { type EffectCallback, useEffect } from "react"

export const scheduleDelayedEffect = (
  callback: EffectCallback,
  delay: number,
) => {
  let cleanup: ReturnType<EffectCallback>

  const timeout = setTimeout(() => {
    cleanup = callback()
  }, delay)

  return () => {
    clearTimeout(timeout)

    if (typeof cleanup === "function") {
      cleanup()
    }
  }
}

export const useDelayEffect = (callback: EffectCallback, delay: number) => {
  useEffect(() => scheduleDelayedEffect(callback, delay), [callback, delay])
}
