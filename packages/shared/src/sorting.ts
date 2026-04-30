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
