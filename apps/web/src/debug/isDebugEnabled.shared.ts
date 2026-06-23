const isEnabled =
  typeof window === "undefined" ||
  typeof window.localStorage?.getItem !== "function"
    ? false // @todo handle service worker with session storage instead
    : window.localStorage.getItem("oboku_debug_enabled") === "true"

export const isDebugEnabled = () => {
  return isEnabled || import.meta.env.DEV
}
