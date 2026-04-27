import { useEffect, useRef, useState, type RefObject } from "react"

export type ScrollTarget =
  | HTMLElement
  | RefObject<HTMLElement | null>
  | null
  | undefined

const resolveTarget = (target: ScrollTarget): HTMLElement | null => {
  if (!target) return null

  return "current" in target ? target.current : target
}

/**
 * Tracks the scroll position of a target element.
 *
 * Accepts either:
 * - an `HTMLElement | null` directly (typically driven by state, e.g. when the
 *   element is captured via a callback ref like Virtuoso's `scrollerRef`);
 * - a stable `RefObject<HTMLElement | null>` that's attached during render.
 *
 * Updates are throttled to one per animation frame.
 *
 * Note: when passing a `RefObject`, the hook only subscribes on renders where
 * `ref.current` is non-null. Refs that are populated post-mount without a
 * subsequent re-render won't trigger a subscription — pass the element via
 * state in that case.
 */
export const useScroll = (target: ScrollTarget) => {
  const element = resolveTarget(target)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const frameRef = useRef(0)

  useEffect(() => {
    if (!element) return

    const update = () => {
      setPosition({ x: element.scrollLeft, y: element.scrollTop })
    }

    const handler = () => {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(update)
    }

    update()
    element.addEventListener("scroll", handler, { passive: true })

    return () => {
      cancelAnimationFrame(frameRef.current)
      element.removeEventListener("scroll", handler)
    }
  }, [element])

  return position
}
