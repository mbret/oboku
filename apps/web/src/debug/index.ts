import { isDebugEnabled } from "./isDebugEnabled.shared"
import "./reporting"

if (isDebugEnabled()) {
  window.__PROSE_READER_DEBUG = true
}

export const toggleDebug = () => {
  if (isDebugEnabled()) {
    localStorage.setItem("oboku_debug_enabled", "false")
  } else {
    localStorage.setItem("oboku_debug_enabled", "true")
  }
  window.location.reload()
}
