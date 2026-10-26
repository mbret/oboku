import { useMediaQuery } from "@mui/material"
import {
  type LocalSettings,
  localSettingsDefaultValues,
  localSettingsSignal,
  useLocalSettings,
} from "../settings/useLocalSettings"

type ResolvedThemeMode = "light" | "dark"

const PREFERS_DARK_COLOR_SCHEME = "(prefers-color-scheme: dark)"

const resolveThemeMode = (
  themeMode: LocalSettings["themeMode"],
  prefersDarkMode: boolean,
): ResolvedThemeMode => {
  const isDarkMode =
    themeMode === "dark" || (themeMode === "system" && prefersDarkMode)

  return isDarkMode ? "dark" : "light"
}

/**
 * Whether the app shows in light or dark colors: the theme setting, the
 * device's color scheme when that setting is `system`, and light for e-ink.
 */
export const useResolvedThemeMode = (): ResolvedThemeMode => {
  const themeMode = useLocalSettings("themeMode")
  const prefersDarkMode = useMediaQuery(PREFERS_DARK_COLOR_SCHEME, {
    noSsr: true,
  })

  return resolveThemeMode(themeMode, prefersDarkMode)
}

/** The mode {@link useResolvedThemeMode} gives, as it is now. */
export const getResolvedThemeMode = (): ResolvedThemeMode =>
  resolveThemeMode(
    localSettingsSignal.getValue().themeMode ??
      localSettingsDefaultValues.themeMode,
    window.matchMedia(PREFERS_DARK_COLOR_SCHEME).matches,
  )
