import {
  atom,
} from 'recoil'
import { SettingsDocType } from '../rxdb'

export const settingsState = atom<SettingsDocType | undefined>({
  key: 'settingsState',
  default: undefined
})