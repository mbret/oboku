import { atom } from "recoil"

export const bookBeingReadState = atom<string | undefined>({
  key: `bookBeingReadState`,
  default: undefined
})

export const hasOpenedReaderAlreadyState = atom({
  key: `hasOpenedReaderAlreadyState`,
  default: false
})
