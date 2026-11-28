/**
 * "N book(s)", or a non-breaking space while the count is unknown, so the
 * line keeps its height.
 */
export const formatBookCount = (count: number | undefined) =>
  count === undefined ? " " : `${count} book(s)`
