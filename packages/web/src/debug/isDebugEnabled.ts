export const isDebugEnabled = () => {
  // @todo handle service worker with session storage instead
  if (typeof window === 'undefined' || !window.localStorage) return false

  return localStorage.getItem('oboku_debug_enabled') === 'true'
}