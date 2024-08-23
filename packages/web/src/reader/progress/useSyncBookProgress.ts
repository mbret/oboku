import { usePagination } from "../states"
import { ReadingStateState } from "@oboku/shared"
import { useDatabase } from "../../rxdb"
import { useMutation } from "reactjrx"
import { useEffect } from "react"
import { from, mergeMap, timer } from "rxjs"

export const useSyncBookProgress = (bookId: string) => {
  const { db } = useDatabase()
  const {
    data: { beginCfi, percentageEstimateOfBook: totalBookProgress } = {}
  } = usePagination()

  const { mutate } = useMutation({
    mapOperator: "switch",
    mutationFn: () =>
      timer(400).pipe(
        mergeMap(() => {
          const updateBook = async () => {
            if (!db) return

            const book = await db?.book
              .findOne({ selector: { _id: bookId } })
              .exec()

            book?.incrementalModify((old) => {
              return {
                ...old,
                // cfi will be undefined at the beginning until pagination stabilize
                ...(beginCfi && {
                  readingStateCurrentBookmarkLocation: beginCfi || null
                }),
                readingStateCurrentBookmarkProgressUpdatedAt:
                  new Date().toISOString(),
                ...(old.readingStateCurrentState !==
                  ReadingStateState.Finished && {
                  readingStateCurrentState: ReadingStateState.Reading,
                  ...(totalBookProgress === 1 && {
                    readingStateCurrentState: ReadingStateState.Finished
                  })
                }),
                ...(typeof totalBookProgress === "number" && {
                  readingStateCurrentBookmarkProgressPercent: totalBookProgress
                })
              }
            })
          }

          return from(updateBook())
        })
      )
  })

  useEffect(() => {
    mutate()
  }, [bookId, beginCfi, totalBookProgress, mutate])
}
