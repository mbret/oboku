export const isDebugEnabled = () => {
  // @handle service worker with session storage instead
  if (!window.localStorage) return false
  
  return localStorage.getItem('oboku_debug_enabled') === 'true'
}