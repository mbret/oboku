import { atom } from "recoil";

export const lastAliveSyncState = atom<number | undefined>({
  key: 'lastAliveSyncState',
  default: undefined
})