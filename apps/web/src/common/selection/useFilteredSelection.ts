import { useCallback, useEffect, useMemo, useRef } from "react"
import {
  useListFilter,
  type ListFilterItem,
  type UseListFilterOptions,
} from "./useListFilter"
import { useSelectionState } from "./useSelectionState"

const EMPTY_IDS: readonly string[] = []

export type UseFilteredSelectionOptions<T extends ListFilterItem> = {
  /**
   * Full set of selectable items (typically the result of an RxDB-backed
   * query). The hook tracks selection against this list so selections
   * outside the current filter are preserved when the user types.
   */
  items: readonly T[]
  /**
   * Persisted baseline ids the selection should diff against. Pass
   * `undefined` while the parent entity is still resolving so the
   * baseline isn't seeded yet and the diff stays empty.
   */
  persistedIds: readonly string[] | undefined
} & UseListFilterOptions<T>

/**
 * Combined state for a "manage X" page that selects items, batches the
 * user's edits, and commits via a Save button (see `BookSelectionPage`,
 * `BookTagsScreen`, `BookCollectionsScreen`).
 *
 * Composes {@link useListFilter} for fuzzy filtering and
 * {@link useSelectionState} for selection tracking + diffing, and adds:
 *
 * - one-shot seeding once `persistedIds` resolves (so async parent
 *   loads don't clobber an in-progress edit on later re-emits)
 * - filter-aware select/unselect helpers (`selectFiltered`,
 *   `unselectFiltered`) that operate only on currently visible ids
 *   while preserving selections outside the filter
 * - a `filteredSelectedCount` so the toolbar's "select all" can
 *   correctly disable once everything *visible* is selected, even when
 *   selection extends beyond the filter.
 */
export function useFilteredSelection<T extends ListFilterItem>({
  items,
  persistedIds,
  getSearchableText,
  debounceMs,
  fuseOptions,
}: UseFilteredSelectionOptions<T>) {
  const { query, setQuery, filteredItems, filteredIds } = useListFilter(items, {
    getSearchableText,
    debounceMs,
    fuseOptions,
  })

  const itemIds = useMemo(() => items.map(({ _id }) => _id), [items])

  const {
    hasChanges,
    selectedIds,
    selectedItems,
    setSelection,
    toAdd,
    toggleSelection,
    toRemove,
  } = useSelectionState(itemIds, {
    initialSelectedIds: persistedIds ?? EMPTY_IDS,
    /**
     * The user's in-progress selection lives as a diff against
     * `persistedIds`; we MUST keep it stable across visible-items
     * churn (e.g. items briefly returning `[]` from the cache on
     * remount, or StrictMode double-firing the mount effects).
     */
    pruneInvisibleItems: false,
  })

  const hasSeededRef = useRef(false)
  /**
   * `persistedIds` is initially `undefined` while the parent entity
   * resolves. Seed exactly once on the transition to "resolved" so
   * later re-emissions (replication writes, other writers) don't
   * clobber the user's pending edits.
   */
  useEffect(
    function seedSelectionOnceResolved() {
      if (hasSeededRef.current) return
      if (persistedIds === undefined) return
      setSelection(persistedIds)
      hasSeededRef.current = true
    },
    [persistedIds, setSelection],
  )

  const filteredSelectedCount = useMemo(
    () => filteredIds.reduce((acc, id) => acc + (selectedItems[id] ? 1 : 0), 0),
    [filteredIds, selectedItems],
  )

  const selectFiltered = useCallback(() => {
    if (filteredIds.length === 0) return
    setSelection(Array.from(new Set([...selectedIds, ...filteredIds])))
  }, [filteredIds, selectedIds, setSelection])

  const unselectFiltered = useCallback(() => {
    if (filteredIds.length === 0) return
    const filterSet = new Set(filteredIds)
    setSelection(selectedIds.filter((id) => !filterSet.has(id)))
  }, [filteredIds, selectedIds, setSelection])

  return {
    query,
    setQuery,
    filteredItems,
    filteredIds,
    selectedItems,
    toggleSelection,
    filteredSelectedCount,
    filteredTotalCount: filteredIds.length,
    selectFiltered,
    unselectFiltered,
    hasChanges,
    toAdd,
    toRemove,
  }
}
