import { signal, useSignalValue } from "reactjrx"

const localSettingsStateDefaultValues = {
  useOptimizedTheme: false,
  readingFullScreenSwitchMode: import.meta.env.DEV
    ? ("never" as const)
    : ("automatic" as const),
  unBlurWhenProtectedVisible: false,
  hideDirectivesFromCollectionName: true,
  showCollectionWithProtectedContent: "unlocked" as const,
  showSensitiveDataSources: false,
}

export const localSettingsSignal = signal<{
  useOptimizedTheme: boolean
  readingFullScreenSwitchMode: "automatic" | "always" | "never"
  unBlurWhenProtectedVisible: boolean
  hideDirectivesFromCollectionName: boolean
  showCollectionWithProtectedContent: "unlocked" | "hasNormalContent"
  showSensitiveDataSources: boolean
}>({
  key: "localSettingsState",
  default: localSettingsStateDefaultValues,
})

export const useLocalSettings = () => useSignalValue(localSettingsSignal)
