import { useMediaQuery } from "@mui/material"
import { useLocalSettings } from "../settings/useLocalSettings"

/**
 * Whether the app shows in light or dark colors: the theme setting, the
 * device's color scheme when that setting is `system`, and light for e-ink.
 */
export const useResolvedThemeMode = (): "light" | "dark" => {
  const themeMode = useLocalSettings("themeMode")
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)", {
    noSsr: true,
  })
  const isDarkMode =
    themeMode === "dark" || (themeMode === "system" && prefersDarkMode)

  return isDarkMode ? "dark" : "light"
}
