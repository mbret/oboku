import { signal, withPersistance } from "reactjrx"

const localSettingsStateDefaultValues = {
  useNavigationArrows: false,
  useOptimizedTheme: false,
  readingFullScreenSwitchMode: import.meta.env.DEV
    ? ("never" as const)
    : ("automatic" as const),
  unBlurWhenProtectedVisible: false,
  hideDirectivesFromCollectionName: true,
  showCollectionWithProtectedContent: "unlocked" as const,
  showSensitiveDataSources: false
}

export const [
  localSettingsStatePersist,
  useLocalSettingsState,
  setLocalSettingsState
] = withPersistance(
  signal<{
    useNavigationArrows: boolean
    useOptimizedTheme: boolean
    readingFullScreenSwitchMode: "automatic" | "always" | "never"
    unBlurWhenProtectedVisible: boolean
    hideDirectivesFromCollectionName: boolean
    showCollectionWithProtectedContent: "unlocked" | "hasNormalContent"
    showSensitiveDataSources: boolean
  }>({
    key: "localSettingsState",
    default: localSettingsStateDefaultValues
  })
)
