import { isDebugEnabled } from "./isDebugEnabled.shared"
import "./sentry"

if (isDebugEnabled()) {
  // @ts-ignore
  window.__PROSE_READER_DEBUG = true
}

if (!isDebugEnabled()) {
  console.log = () => {}
  console.warn = () => {}
}

export const toggleDebug = () => {
  if (isDebugEnabled()) {
    localStorage.setItem("oboku_debug_enabled", "false")
  } else {
    localStorage.setItem("oboku_debug_enabled", "true")
  }
  window.location.reload()
}
