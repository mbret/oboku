import { useReader } from "../states"
import { ReadingStateState } from "@oboku/shared"
import { useDatabase } from "../../rxdb"
import { useMutation$, useSubscribe } from "reactjrx"
import {
  defaultIfEmpty,
  defer,
  distinctUntilChanged,
  EMPTY,
  from,
  noop,
  throttle,
} from "rxjs"
import { isShallowEqual, mapKeysTo } from "@prose-reader/core"
import { useCallback } from "react"

export const useSyncBookProgress = (bookId: string) => {
  const { db } = useDatabase()
  const reader = useReader()

  const { mutateAsync } = useMutation$({
    mutationFn: (params: {
      bookId: string
      beginCfi: string | undefined
      percentageEstimateOfBook: number | undefined
    }) =>
      defer(() => {
        const updateBook = async () => {
          if (!db) return

          const book = await db?.book
            .findOne({ selector: { _id: params.bookId } })
            .exec()

          await book?.incrementalModify((old) => {
            return {
              ...old,
              // cfi will be undefined at the beginning until pagination stabilize
              ...(params.beginCfi && {
                readingStateCurrentBookmarkLocation: params.beginCfi || null,
              }),
              readingStateCurrentBookmarkProgressUpdatedAt:
                new Date().toISOString(),
              ...(old.readingStateCurrentState !==
                ReadingStateState.Finished && {
                readingStateCurrentState: ReadingStateState.Reading,
                ...(params.percentageEstimateOfBook === 1 && {
                  readingStateCurrentState: ReadingStateState.Finished,
                }),
              }),
              ...(typeof params.percentageEstimateOfBook === "number" && {
                readingStateCurrentBookmarkProgressPercent:
                  params.percentageEstimateOfBook,
              }),
            }
          })

          return undefined
        }

        return from(updateBook())
      }).pipe(defaultIfEmpty(null)),
  })

  const syncBookProgress = useCallback(() => {
    if (!reader) return EMPTY

    return reader.pagination.state$.pipe(
      mapKeysTo(["beginCfi", "percentageEstimateOfBook"]),
      distinctUntilChanged(isShallowEqual),
      throttle((data) => from(mutateAsync({ bookId, ...data }).catch(noop)), {
        trailing: true,
      }),
    )
  }, [mutateAsync, reader, bookId])

  useSubscribe(syncBookProgress)
}
