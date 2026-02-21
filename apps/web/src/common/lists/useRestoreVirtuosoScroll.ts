import { useCallback, useRef, useState } from "react"
import type { GridStateSnapshot, StateSnapshot } from "react-virtuoso"
import { signal } from "reactjrx"
import type { VirtuosoGridListHandle } from "./VirtuosoList"

const restoreScrollSignal = signal<
  Record<
    string,
    | { type: "list"; state: StateSnapshot }
    | { type: "grid"; state: GridStateSnapshot }
  >
>({
  key: "restoreScrollSignal",
  default: {},
})

export const useRestoreVirtuosoScroll = ({
  virtuosoRef,
  restoreScrollId,
}: {
  virtuosoRef: React.RefObject<VirtuosoGridListHandle | null>
  restoreScrollId?: string
}) => {
  const [isRestored, setIsRestored] = useState(false)
  const restoreStateFromFirstValue = useRef(
    restoreScrollId ? restoreScrollSignal.value[restoreScrollId] : undefined,
  )

  const restoreScrollState = useCallback(() => {
    if (restoreScrollId === undefined) return

    if (!restoreStateFromFirstValue.current) return

    setIsRestored(true)

    if (
      restoreStateFromFirstValue.current.type === "list" &&
      virtuosoRef.current?.isGrid
    ) {
      return
    }

    virtuosoRef.current?.scrollTo({
      behavior: "instant",
      left: 0,
      top: restoreStateFromFirstValue.current.state.scrollTop,
    })
  }, [virtuosoRef, restoreScrollId])

  const saveScrollState = useCallback(
    (scrollEvent: React.UIEvent<HTMLDivElement, UIEvent>) => {
      if (restoreScrollId !== undefined && virtuosoRef.current) {
        if (virtuosoRef.current.isGrid) {
          restoreScrollSignal.update((state) => ({
            ...state,
            [restoreScrollId]: {
              state: {
                gap: { column: 0, row: 0 },
                item: { height: 0, width: 0 },
                viewport: { height: 0, width: 0 },
                scrollTop: (scrollEvent.target as HTMLDivElement).scrollTop,
              },
              type: "grid" as const,
            },
          }))
        } else {
          restoreScrollSignal.update((state) => ({
            ...state,
            [restoreScrollId]: {
              state: {
                ranges: [],
                scrollTop: (scrollEvent.target as HTMLDivElement).scrollTop,
                scrollLeft: (scrollEvent.target as HTMLDivElement).scrollLeft,
              },
              type: "list" as const,
            },
          }))
        }
      }
    },
    [restoreScrollId, virtuosoRef],
  )

  const resetScrollState = useCallback(() => {
    if (restoreScrollId === undefined) return

    restoreScrollSignal.update((state) => {
      const { [restoreScrollId]: _, ...rest } = state

      return rest
    })
  }, [restoreScrollId])

  return {
    restoreScrollState,
    saveScrollState,
    resetScrollState,
    restoreStateFromFirstValue: restoreStateFromFirstValue.current,
    isRestored,
  }
}
