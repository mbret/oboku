/**
 * Builds a memoizable selector that reads a property from a signal value.
 *
 * Useful with `useSignalValue` to avoid recreating an inline selector on every
 * render and to keep the selector reference stable when extracted to module
 * scope.
 *
 * @example
 *   const selectByLibraryUnlocked = selectByProperty("isLibraryUnlocked")
 *   const isLibraryUnlocked = useSignalValue(libraryStateSignal, selectByLibraryUnlocked)
 */
export const selectByProperty =
  <K extends PropertyKey>(key: K) =>
  <T extends Record<K, unknown>>(value: T): T[K] =>
    value[key]
