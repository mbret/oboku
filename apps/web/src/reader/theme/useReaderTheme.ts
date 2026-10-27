import type { Theme } from "@prose-reader/core"
import { useCallback, useEffect } from "react"
import { useLiveRef } from "reactjrx"
import { useResolvedThemeMode } from "../../theme/useResolvedThemeMode"
import { readerSignal } from "../states"

/**
 * The reader's theme for the app's light or dark mode. `getTheme` gives the
 * theme of the latest render, for code that reads it without depending on it.
 */
export const useReaderTheme = () => {
  const theme: Theme = useResolvedThemeMode() === "dark" ? "night" : "bright"
  const themeRef = useLiveRef(theme)
  const getTheme = useCallback(
    function getLatestTheme() {
      return themeRef.current
    },
    [themeRef],
  )

  return { theme, getTheme }
}

/**
 * Reads the open reader when the theme changes, rather than subscribing to
 * it, so a reader closed in the same commit is never touched.
 *
 * TODO: give the theme to `<ReactReader theme>` instead, once prose-reader
 * releases https://github.com/mbret/prose-reader/pull/643.
 */
export const useSyncReaderTheme = () => {
  const { theme } = useReaderTheme()

  useEffect(
    function followAppColorScheme() {
      readerSignal.getValue()?.theme.set(theme)
    },
    [theme],
  )
}
