import { usePagination } from "../states"
import { ReadingStateState } from "@oboku/shared"
import { useDatabase } from "../../rxdb"
import { useMutation$, useObservableCallback, useSubscribe } from "reactjrx"
import { useEffect } from "react"
import { defaultIfEmpty, defer, from, noop, throttle } from "rxjs"

export const useSyncBookProgress = (bookId: string) => {
  const { db } = useDatabase()
  const {
    data: { beginCfi, percentageEstimateOfBook: totalBookProgress } = {},
  } = usePagination()
  const [mutate$, mutate] = useObservableCallback()

  const { mutateAsync } = useMutation$({
    mutationFn: () =>
      defer(() => {
        const updateBook = async () => {
          if (!db) return

          const book = await db?.book
            .findOne({ selector: { _id: bookId } })
            .exec()

          await book?.incrementalModify((old) => {
            return {
              ...old,
              // cfi will be undefined at the beginning until pagination stabilize
              ...(beginCfi && {
                readingStateCurrentBookmarkLocation: beginCfi || null,
              }),
              readingStateCurrentBookmarkProgressUpdatedAt:
                new Date().toISOString(),
              ...(old.readingStateCurrentState !==
                ReadingStateState.Finished && {
                readingStateCurrentState: ReadingStateState.Reading,
                ...(totalBookProgress === 1 && {
                  readingStateCurrentState: ReadingStateState.Finished,
                }),
              }),
              ...(typeof totalBookProgress === "number" && {
                readingStateCurrentBookmarkProgressPercent: totalBookProgress,
              }),
            }
          })

          return undefined
        }

        return from(updateBook())
      }).pipe(defaultIfEmpty(null)),
  })

  useSubscribe(
    () =>
      mutate$.pipe(
        throttle(() => from(mutateAsync().catch(noop)), { trailing: true }),
      ),
    [mutateAsync, mutate$],
  )

  useEffect(() => {
    mutate()
  }, [bookId, beginCfi, totalBookProgress, mutate])
}
