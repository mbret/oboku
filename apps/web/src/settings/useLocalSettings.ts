/**
 * Settings that are only kept for a user session on the device itself.
 */
import { signal, useSignalValue } from "reactjrx"
import type { Mode } from "@mui/system/cssVars/useCurrentColorScheme"

export const localSettingsDefaultValues = {
  readingFullScreenSwitchMode: import.meta.env.DEV
    ? ("never" as const)
    : ("automatic" as const),
  unBlurWhenProtectedVisible: false,
  hideDirectivesFromCollectionName: true,
  showCollectionWithProtectedContent: "unlocked" as const,
  showSensitiveDataSources: false,
  /**
   * @important
   * As long as a profile is not loaded, the app will default to system mode
   */
  themeMode: "system" as const,
  readerFloatingTime: "bottom" as const,
  readerFloatingProgress: "bottom" as const,
}

export const localSettingsSignal = signal<{
  readingFullScreenSwitchMode: "automatic" | "always" | "never"
  unBlurWhenProtectedVisible: boolean
  hideDirectivesFromCollectionName: boolean
  showCollectionWithProtectedContent: "unlocked" | "hasNormalContent"
  showSensitiveDataSources: boolean
  themeMode?: Mode | "e-ink"
  readerFloatingTime?: "bottom"
  readerFloatingProgress?: "bottom"
}>({
  key: "localSettingsState",
  default: localSettingsDefaultValues,
})

export const useLocalSettings = () => useSignalValue(localSettingsSignal)
