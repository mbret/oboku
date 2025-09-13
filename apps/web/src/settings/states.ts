import { signal, useSignalValue } from "reactjrx"
import type { Mode } from "@mui/system/cssVars/useCurrentColorScheme"

const localSettingsStateDefaultValues = {
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
}

export const localSettingsSignal = signal<{
  readingFullScreenSwitchMode: "automatic" | "always" | "never"
  unBlurWhenProtectedVisible: boolean
  hideDirectivesFromCollectionName: boolean
  showCollectionWithProtectedContent: "unlocked" | "hasNormalContent"
  showSensitiveDataSources: boolean
  themeMode?: Mode | "e-ink"
}>({
  key: "localSettingsState",
  default: localSettingsStateDefaultValues,
})

export const useLocalSettings = () => useSignalValue(localSettingsSignal)
