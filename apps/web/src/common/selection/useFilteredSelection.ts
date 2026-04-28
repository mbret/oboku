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
  /**
   * Stable id of the parent entity being edited (e.g. `bookId`,
   * `tagId`). The seeded selection is keyed by this value so that
   * navigating between same-route entity ids (a normal React Router
   * behavior, e.g. `/book/A/tags` → `/book/B/tags`, that does NOT
   * unmount the screen) reseeds from the new entity's `persistedIds`
   * instead of carrying the previous entity's pending edits over —
   * which would otherwise let `Save` apply a stale diff against the
   * new baseline.
   */
  entityKey: string
} & UseListFilterOptions<T>

/**
 * Combined state for a "manage X" page that selects items, batches the
 * user's edits, and commits via a Save button (see `BookSelectionView`,
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
  entityKey,
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

  const seededForKeyRef = useRef<string | null>(null)
  /**
   * Seed the selection from `persistedIds` exactly once per parent
   * entity, keyed by `entityKey`:
   *
   * - while still on the same `entityKey`, later `persistedIds`
   *   re-emissions (replication writes, other writers) do NOT clobber
   *   the user's pending edits;
   * - when `entityKey` changes (e.g. same-route param change navigating
   *   from `/book/A/tags` → `/book/B/tags`, which does not unmount the
   *   screen), the previous entity's selection is dropped and the new
   *   entity is re-seeded from its own `persistedIds` — otherwise
   *   `toAdd`/`toRemove` would diff a stale selection against the new
   *   baseline and `Save` could apply unintended mutations.
   */
  useEffect(
    function seedSelectionForEntity() {
      if (seededForKeyRef.current === entityKey) return

      if (persistedIds === undefined) {
        // Entity changed but its baseline (parent entity query) hasn't
        // resolved yet. If we had seeded for a prior entity, clear so
        // its selection can't leak into the diff for the next one.
        if (seededForKeyRef.current !== null) {
          setSelection(EMPTY_IDS)
          seededForKeyRef.current = null
        }
        return
      }

      setSelection(persistedIds)
      seededForKeyRef.current = entityKey
    },
    [entityKey, persistedIds, setSelection],
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
