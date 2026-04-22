import { useCallback, useEffect, useMemo, useState } from "react"

type SelectedItemsState = Record<string, true>

function pruneSelectionToVisibleItems(
  current: SelectedItemsState,
  visibleItemIds: string[],
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

export function useSelectionState<ItemId extends string>(
  visibleItemIds: ItemId[],
) {
  const [selectedItems, setSelectedItems] = useState<SelectedItemsState>({})

  useEffect(
    function syncSelectionWithVisibleItems() {
      setSelectedItems((current) =>
        pruneSelectionToVisibleItems(current, visibleItemIds),
      )
    },
    [visibleItemIds],
  )

  const selectedIds = useMemo(
    () => Object.keys(selectedItems) as ItemId[],
    [selectedItems],
  )

  const selectedCount = selectedIds.length

  const isSelectionMode = selectedCount > 0

  const clearSelection = useCallback(() => {
    setSelectedItems({})
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

  return {
    clearSelection,
    isSelectionMode,
    selectedCount,
    selectedIds,
    selectedItems,
    startSelection,
    toggleSelection,
  }
}
