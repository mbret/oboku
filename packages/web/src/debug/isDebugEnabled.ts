export const isDebugEnabled = () => {
  return localStorage.getItem('oboku_debug_enabled') === 'true'
}