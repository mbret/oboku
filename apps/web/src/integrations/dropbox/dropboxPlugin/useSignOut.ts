import { SIGNAL_RESET } from "reactjrx"
import { dropboxAuthSignal } from "./lib/auth"

export const useSignOut = () => {
  return () => {
    dropboxAuthSignal.update(SIGNAL_RESET)
  }
}
