import { atom } from 'recoil'
import { SettingsDocType } from '../rxdb'

export const settingsState = atom<SettingsDocType | undefined>({
  key: 'settingsState',
  default: undefined
})

const localSettingsStateDefaultValues = {
  useNavigationArrows: false,
  readingFullScreenSwitchMode: process.env.NODE_ENV !== 'production' ? 'never' as const : 'automatic' as const,
  unblurWhenProtectedVisible: false,
  hideDirectivesFromCollectionName: true,
}

export const localSettingsState = atom<{
  useNavigationArrows: boolean
  readingFullScreenSwitchMode: 'automatic' | 'always' | 'never',
  unblurWhenProtectedVisible: boolean,
  hideDirectivesFromCollectionName: boolean,
}>({
  key: 'localSettingsState',
  default: localSettingsStateDefaultValues
})

export const localSettingsStateMigration = (state: { [key: string]: { value: any } }) => ({
  ...state,
  [localSettingsState.key]: {
    value: {
      ...localSettingsStateDefaultValues,
      ...state[localSettingsState.key]?.value,
    }
  }
})