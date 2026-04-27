/**
 * Stable, module-level selectors for use with `useQuery`'s `select` option.
 *
 * Defining selectors at module scope (rather than inline) keeps their
 * reference identity stable across renders, which lets TanStack Query reuse
 * the previously computed output instead of recomputing it on every render.
 */

/**
 * Maps any RxDB-style document collection to its `_id` array.
 *
 * Use as a `select` for any `useQuery` that returns `{ _id: string }[]`,
 * e.g. `useBooks({ select: selectIds })`.
 */
export const selectIds = <T extends { readonly _id: string }>(
  items: ReadonlyArray<T>,
): string[] => items.map((item) => item._id)
