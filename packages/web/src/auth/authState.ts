import { atom } from "recoil"

export const authState = atom<
  | {
      token: string
      email: string
      nameHex: string
      dbName: string
    }
  | undefined
>({
  key: "authState",
  default: undefined
})
