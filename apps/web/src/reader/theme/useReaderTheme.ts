import type { Theme } from "@prose-reader/core"
import { useEffect } from "react"
import { useResolvedThemeMode } from "../../theme/useResolvedThemeMode"
import { readerSignal } from "../states"

export const useReaderTheme = (): Theme =>
  useResolvedThemeMode() === "dark" ? "night" : "bright"

/**
 * Reads the open reader when the theme changes, rather than subscribing to
 * it, so a reader closed in the same commit is never touched.
 */
export const useSyncReaderTheme = () => {
  const readerTheme = useReaderTheme()

  useEffect(
    function followAppColorScheme() {
      readerSignal.getValue()?.theme.set(readerTheme)
    },
    [readerTheme],
  )
}
