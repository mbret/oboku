import {
  atom,
} from 'recoil'
import { AuthDocType } from '../databases'

export const authState = atom<AuthDocType | undefined>({
  key: 'authState',
  default: undefined
})