import localforage from "localforage"
import { isDebugEnabled } from "./isDebugEnabled.shared"
import "./reportWebVitals"
import "./sentry"

// @ts-ignore
window.localforage = localforage

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
