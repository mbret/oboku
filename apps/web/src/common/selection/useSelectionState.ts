import { useCallback, useEffect, useMemo, useState } from "react"

type SelectedItemsState = Record<string, true>

function toSelectionState<ItemId extends string>(
  ids: readonly ItemId[] | undefined,
): SelectedItemsState {
  if (!ids || ids.length === 0) return {}

  return ids.reduce<SelectedItemsState>((acc, id) => {
    acc[id] = true
    return acc
  }, {})
}

function pruneSelectionToVisibleItems(
  current: SelectedItemsState,
  visibleItemIds: readonly string[],
) {
  let nextSelectionSize = 0

  const nextSelection = visibleItemIds.reduce<SelectedItemsState>(
    (acc, itemId) => {
      if (!current[itemId]) {
        return acc
      }

      acc[itemId] = true
      nextSelectionSize += 1

      return acc
    },
    {},
  )

  return Object.keys(current).length === nextSelectionSize
    ? current
    : nextSelection
}

export type UseSelectionStateOptions<ItemId extends string> = {
  /**
   * acts as the live baseline; change its identity and the diff recomputes against the new baseline
   */
  initialSelectedIds?: readonly ItemId[]
}

export function useSelectionState<ItemId extends string>(
  visibleItemIds: readonly ItemId[],
  { initialSelectedIds }: UseSelectionStateOptions<ItemId> = {},
) {
  const [selectedItems, setSelectedItems] = useState<SelectedItemsState>(() =>
    toSelectionState(initialSelectedIds),
  )

  useEffect(
    function syncSelectionWithVisibleItems() {
      setSelectedItems((current) =>
        pruneSelectionToVisibleItems(current, visibleItemIds),
      )
    },
    [visibleItemIds],
  )

  const selectedIds = useMemo(
    // Object.keys loses the narrow ItemId type; safe because we only
    // ever write ItemId-typed keys into `selectedItems`.
    () => Object.keys(selectedItems) as ItemId[],
    [selectedItems],
  )

  const selectedCount = selectedIds.length

  const isSelectionMode = selectedCount > 0

  const clearSelection = useCallback(() => {
    setSelectedItems({})
  }, [])

  const selectAll = useCallback(() => {
    setSelectedItems(toSelectionState(visibleItemIds))
  }, [visibleItemIds])

  const setSelection = useCallback((ids: readonly ItemId[]) => {
    setSelectedItems(toSelectionState(ids))
  }, [])

  const startSelection = useCallback((itemId: ItemId) => {
    setSelectedItems((current) => {
      if (current[itemId]) {
        return current
      }

      return {
        ...current,
        [itemId]: true,
      }
    })
  }, [])

  const toggleSelection = useCallback((itemId: ItemId) => {
    setSelectedItems((current) => {
      if (current[itemId]) {
        const nextSelection = { ...current }

        delete nextSelection[itemId]

        return nextSelection
      }

      return {
        ...current,
        [itemId]: true,
      }
    })
  }, [])

  const { toAdd, toRemove, hasChanges } = useMemo(() => {
    if (!initialSelectedIds) {
      return {
        toAdd: [] as ItemId[],
        toRemove: [] as ItemId[],
        hasChanges: false,
      }
    }

    const baselineSet = new Set(initialSelectedIds)
    const nextToAdd: ItemId[] = []
    const nextToRemove: ItemId[] = []

    for (const id of selectedIds) {
      if (!baselineSet.has(id)) nextToAdd.push(id)
    }

    for (const id of initialSelectedIds) {
      if (!selectedItems[id]) nextToRemove.push(id)
    }

    return {
      toAdd: nextToAdd,
      toRemove: nextToRemove,
      hasChanges: nextToAdd.length > 0 || nextToRemove.length > 0,
    }
  }, [initialSelectedIds, selectedIds, selectedItems])

  return {
    clearSelection,
    hasChanges,
    isSelectionMode,
    selectAll,
    selectedCount,
    selectedIds,
    selectedItems,
    setSelection,
    startSelection,
    toAdd,
    toggleSelection,
    toRemove,
  }
}
