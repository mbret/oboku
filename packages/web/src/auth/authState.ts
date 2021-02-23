import {
  atom,
} from 'recoil'

export const authState = atom<{
  token: string,
  email: string,
  userId: string,
  dbName: string
} | undefined>({
  key: 'authState',
  default: undefined
})