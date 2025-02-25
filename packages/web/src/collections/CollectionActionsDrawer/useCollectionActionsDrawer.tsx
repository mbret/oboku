import { useEffect } from "react"
import { useCallback } from "react"
import { useRef } from "react"
import { signal, useSignalValue } from "reactjrx"

export const collectionActionDrawerState = signal<{
  openedWith: undefined | string
  lastId?: undefined | string
}>({
  key: "collectionActionDrawerState",
  default: { openedWith: undefined, lastId: undefined },
})

export const collectionActionDrawerChangesState = signal<
  undefined | [string, `delete`]
>({
  key: `collectionActionDrawerChangesState`,
  default: undefined,
})

export const useCollectionActionsDrawer = (
  id: string,
  onChanges?: (change: `delete`) => void,
) => {
  const collectionActionDrawerChanges = useSignalValue(
    collectionActionDrawerChangesState,
  )
  // we use this to only ever emit once every changes
  // this also ensure when first subscribing to the hook we do not trigger the previous changes
  const latestChangesEmittedRef = useRef(collectionActionDrawerChanges)

  const open = useCallback(() => {
    collectionActionDrawerState.setValue({ openedWith: id, lastId: id })
  }, [id])

  useEffect(() => {
    if (collectionActionDrawerChanges) {
      if (collectionActionDrawerChanges !== latestChangesEmittedRef.current) {
        const [changeForId, change] = collectionActionDrawerChanges
        if (changeForId === id) {
          onChanges && onChanges(change)
          latestChangesEmittedRef.current = collectionActionDrawerChanges
        }
      }
    }
  }, [collectionActionDrawerChanges, onChanges, id])

  return {
    open,
  }
}
