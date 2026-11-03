import { SIGNAL_RESET } from "reactjrx"
import { dropboxAuthSignal } from "./lib/auth"

export function signOut() {
  dropboxAuthSignal.update(SIGNAL_RESET)
}
