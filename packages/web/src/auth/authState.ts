import {
  atom,
} from 'recoil'
import { AuthDocType } from '../rxdb'

export const authState = atom<AuthDocType | undefined>({
  key: 'authState',
  default: undefined
})