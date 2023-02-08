import { atom } from "recoil"
import { SettingsDocType } from "../rxdb"

export const settingsState = atom<SettingsDocType | undefined>({
  key: "settingsState",
  default: undefined
})

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

export const localSettingsState = atom<{
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

export const localSettingsStateMigration = (state: {
  [key: string]: { value: any }
}) => ({
  ...state,
  [localSettingsState.key]: {
    value: {
      ...localSettingsStateDefaultValues,
      // IMPORTANT, the state can be undefined if app is bootstrap the first time, need to type it here
      ...state[localSettingsState.key]?.value
    }
  }
})
