const isEnabled =
  typeof window === "undefined" || !window.localStorage
    ? false // @todo handle service worker with session storage instead
    : localStorage.getItem("oboku_debug_enabled") === "true"

export const isDebugEnabled = () => {
  return isEnabled || import.meta.env.DEV
}
