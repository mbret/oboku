import { reloadPage } from "../common/browser"
import { isDebugEnabled } from "./isDebugEnabled.shared"
import "./reporting"

if (isDebugEnabled()) {
  globalThis.__PROSE_READER_DEBUG = true
}

export const toggleDebug = () => {
  if (isDebugEnabled()) {
    localStorage.setItem("oboku_debug_enabled", "false")
  } else {
    localStorage.setItem("oboku_debug_enabled", "true")
  }
  reloadPage()
}
