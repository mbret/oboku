import { useMemo, useState } from "react"
import Fuse, { type IFuseOptions } from "fuse.js"
import { useDebouncedValue } from "../useDebouncedValue"

const SEARCHABLE_KEY = "__searchable"

export type UseListFilterOptions<T> = {
  /**
   * Returns the haystack string Fuse will index for each item.
   * Concatenate fields with spaces if you want to match across them
   * (e.g. a book's title + authors).
   */
  getSearchableText: (item: T) => string
  /**
   * Delay before the typed query is applied to filtering. Defaults to
   * 200ms, which is enough to avoid filtering on every keystroke for
   * larger lists without feeling laggy.
   */
  debounceMs?: number
  /**
   * Override Fuse tuning options (threshold, distance, ignoreLocation,
   * ...). The `keys` and `getFn` are managed internally so callers
   * can't accidentally bypass `getSearchableText`.
   */
  fuseOptions?: Omit<IFuseOptions<T>, "keys" | "getFn">
}

const DEFAULT_FUSE_OPTIONS: Omit<IFuseOptions<unknown>, "keys" | "getFn"> = {
  /**
   * Lower threshold = stricter match. 0.3 is a balance between catching
   * obvious typos and avoiding noisy results on short fields like tag
   * names.
   */
  threshold: 0.3,
  /**
   * We don't care where in the string the match is — a tag named
   * "non-fiction" should match "fiction" regardless of position.
   */
  ignoreLocation: true,
  ignoreDiacritics: true,
  /**
   * Token search splits the haystack on whitespace and matches each
   * token independently with TF-IDF ranking. This means:
   * - users can type words in any order ("philosopher harry" finds
   *   "Harry Potter and the Philosopher's Stone")
   * - common tokens are down-weighted so rare-but-relevant matches
   *   surface first
   * - single-word fields (tag names, short collection titles) just
   *   index as one token, so this is a no-op for them
   *
   * @see https://www.fusejs.io/token-search.html
   */
  useTokenSearch: true,
}

/**
 * Minimum shape every item needs to satisfy. RxDB documents (and the
 * `DeepReadonlyObject<XDocType>` projections we use across the web
 * app) all expose `_id`, which lets the hook return ready-to-use ids
 * for the virtualized lists without each caller mapping again.
 */
export type ListFilterItem = {
  readonly _id: string
}

/**
 * Generic fuzzy filter for selectable lists, backed by Fuse.js. Owns
 * the query state, debouncing, and id projection so screens just have
 * to render the input and consume `filteredItems` / `filteredIds`.
 *
 * Pair with `SelectionListFilter` for the input UI.
 */
export function useListFilter<T extends ListFilterItem>(
  items: readonly T[],
  { getSearchableText, debounceMs = 200, fuseOptions }: UseListFilterOptions<T>,
) {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query, debounceMs)

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        ...DEFAULT_FUSE_OPTIONS,
        ...fuseOptions,
        keys: [
          {
            name: SEARCHABLE_KEY,
            getFn: getSearchableText,
          },
        ],
      }),
    [items, getSearchableText, fuseOptions],
  )

  const { filteredItems, filteredIds } = useMemo(() => {
    const trimmed = debouncedQuery.trim()
    const matches: readonly T[] = trimmed
      ? fuse.search(trimmed).map((result) => result.item)
      : items
    return {
      filteredItems: matches,
      filteredIds: matches.map(({ _id }) => _id),
    }
  }, [items, debouncedQuery, fuse])

  return { query, setQuery, filteredItems, filteredIds }
}
