import {
  atom,
} from 'recoil'
import { SettingsDocType } from '../databases'

export const settingsState = atom<SettingsDocType | undefined>({
  key: 'settingsState',
  default: undefined
})