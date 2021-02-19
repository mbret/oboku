import {
  atom,
} from 'recoil'
import { SettingsDocType } from '../rxdb'

export const settingsState = atom<SettingsDocType | undefined>({
  key: 'settingsState',
  default: undefined
})

export const localSettingsState = atom<{
  useNavigationArrows: boolean
  readingFullScreenSwitchMode: 'automatic' | 'always' | 'never'
}>({
  key: 'localSettingsState',
  default: {
    useNavigationArrows: false,
    readingFullScreenSwitchMode: process.env.NODE_ENV !== 'production' ? 'never' : 'automatic'
  }
})