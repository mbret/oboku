import { useSignalValue, useObserve } from "reactjrx"
import { readerSignal } from "../states"

export const useIsUsingReverseNavigation = () => {
  const reader = useSignalValue(readerSignal)
  const { manifest } = useObserve(() => reader?.context.state$, [reader]) || {}
  const settings = useObserve(() => reader?.settings.values$, [reader])
  const { readingDirection } = manifest ?? {}

  // overwrite readingDirection
  if (settings?.computedPageTurnDirection === "vertical") return false

  if (readingDirection === "rtl") return true

  return false
}
