import type { Theme } from "@prose-reader/core"
import { useEffect } from "react"
import {
  getResolvedThemeMode,
  useResolvedThemeMode,
} from "../../theme/useResolvedThemeMode"
import { readerSignal } from "../states"

const toReaderTheme = (themeMode: "light" | "dark"): Theme =>
  themeMode === "dark" ? "night" : "bright"

/** The reader's theme for the app's colors as they are now. */
export const getReaderTheme = (): Theme => toReaderTheme(getResolvedThemeMode())

/**
 * Reads the open reader when the theme changes, rather than subscribing to
 * it, so a reader closed in the same commit is never touched.
 */
export const useSyncReaderTheme = () => {
  const readerTheme = toReaderTheme(useResolvedThemeMode())

  useEffect(
    function followAppColorScheme() {
      readerSignal.getValue()?.theme.set(readerTheme)
    },
    [readerTheme],
  )
}
