/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// MIT © 2017 azu
const hasOwn = Object.prototype.hasOwnProperty

// Object.is polyfill
export const is = (x: any, y: any): boolean => {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y
  }
  return false
}

/**
 * Return true, if `objectA` is shallow equal to `objectB`.
 * Pass Custom equality function to `customEqual`.
 * Default equality is `Object.is`
 * Support Array
 *
 * Options:
 *
 * - `customEqual`: function should return true if the `a` value is equal to `b` value.
 * - `debug`: enable debug info to console log. This log will be disable in production build
 */
export const isShallowEqual = <T = any, R = any>(
  objectA: T,
  objectB: R,
  options?: {
    customEqual?: <T>(a: T, b: T) => boolean
  },
): boolean => {
  // @ts-expect-error
  if (objectA === objectB) {
    return true
  }
  if (typeof objectA !== "object" || objectA === null) {
    return false
  }
  if (typeof objectB !== "object" || objectB === null) {
    return false
  }

  const keysA = Object.keys(objectA)
  const keysB = Object.keys(objectB)

  if (keysA.length !== keysB.length) {
    return false
  }

  const isEqual =
    options && typeof options.customEqual === "function"
      ? options.customEqual
      : is

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i] || ``
    // @ts-expect-error
    if (!hasOwn.call(objectB, key) || !isEqual(objectA[key], objectB[key])) {
      return false
    }
  }

  return true
}
