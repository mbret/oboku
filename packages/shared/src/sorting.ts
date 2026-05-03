/**
 * Reusable collator for book / collection title sorting.
 *
 * - `numeric: true` gives natural-numeric ordering of digit runs inside a
 *   title, so "Vol. 2" precedes "Vol. 10" instead of being compared as plain
 *   strings ("10" < "2" lexicographically).
 * - `sensitivity: "base"` makes the comparison case- AND accent-insensitive
 *   ("café" === "Cafe" === "cafe"), which matches reader expectations when
 *   browsing a library.
 *
 * A single instance is reused for all calls — `Intl.Collator.compare` is
 * already a bound function, so it can be used directly as an `Array#sort`
 * callback.
 */
const titleCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
})

export const sortByTitleComparator = (a: string, b: string): number =>
  titleCollator.compare(a, b)

/**
 * Comparator that orders any naturally-comparable primitive (numbers, ISO-8601
 * strings, `Date` instances) in descending order — i.e. greatest / most recent
 * first.
 *
 * Useful for "latest first" lists where the underlying field is already an ISO
 * timestamp string, a millisecond number, or a `Date`, so a per-comparison
 * `new Date(...)` parse is unnecessary.
 *
 * Implementation note: equality is decided via `valueOf()` so that two
 * different `Date` instances representing the same moment compare equal
 * (returning 0). Using `a === b` would only catch reference equality and
 * could leave the comparator returning -1 in both directions for equal
 * `Date`s, breaking `Array#sort`'s anti-symmetry requirement.
 */
export const compareDesc = <T extends string | number | Date>(
  a: T,
  b: T,
): number => {
  const aValue = a.valueOf()
  const bValue = b.valueOf()

  if (aValue === bValue) return 0

  return aValue < bValue ? 1 : -1
}
