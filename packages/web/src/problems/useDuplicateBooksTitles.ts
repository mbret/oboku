import { BookDocType, ReadingStateState } from "@oboku/shared"
import { groupBy, mergeWith } from "lodash"
import { useCallback, useMemo } from "react"
import { DeepMutable } from "rxdb/dist/types/types"
import { Report } from "../debug/report.shared"
import { useDatabase } from "../rxdb"
import { BookDocument } from "../rxdb/schemas/book"
import { useObserve } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { switchMap } from "rxjs"
import { getMetadataFromBook } from "../books/getMetadataFromBook"

export const useDuplicatedBookTitles = () => {
  const books = useObserve(
    () => latestDatabase$.pipe(switchMap((db) => db?.book.find().$)),
    []
  )

  return useMemo(() => {
    const booksWithValidTitle = books?.filter(
      (doc) => !!getMetadataFromBook(doc).title
    )

    const docsByTitle = groupBy(booksWithValidTitle, "title")

    const duplicatedDocs = Object.keys(docsByTitle)
      .filter((title) => docsByTitle[title]!.length > 1)
      .map((title) => [title, docsByTitle[title]])

    return duplicatedDocs as [string, BookDocument[]][]
  }, [books])
}

export const useFixDuplicatedBookTitles = () => {
  const { db: database } = useDatabase()

  return useCallback(
    async (data: [string, BookDocument[]][]) => {
      const yes = window.confirm(
        `
            This action will merge books that uses the same title.
            We will try to use a non destructive merge by keeping defined properties when possible. 
            You may want to re-sync after the operation to restore value with their latest state.
            `.replace(/  +/g, "")
      )

      if (yes && database) {
        try {
          await Promise.all(
            data.map(async ([title]) => {
              const docsWithSameTitle = await database?.book
                .find({ selector: { title: title } })
                .exec()

              const docsAsJson = docsWithSameTitle
                .map(
                  (document) => document.toJSON() as DeepMutable<BookDocType>
                )
                .sort((a, b) => {
                  // if the book is not started we prioritize the other one (who might be equal or greater)
                  if (
                    a.readingStateCurrentState === ReadingStateState.NotStarted
                  )
                    return -1

                  return 1
                })

              // reduce will keep the correct order, which is important for the merge
              const mergedDoc = docsAsJson?.reduce((previous, current) => {
                // we use || to be as less destructive as possible
                return mergeWith((a, b) => b || a, previous, current)
              }, docsAsJson[0])

              if (!mergedDoc) return

              const { _id, _rev, ...safeMergedDoc } = mergedDoc

              // we update the first entry with the all merged data
              await docsWithSameTitle[0]?.atomicUpdate((oldData) => ({
                ...oldData,
                ...safeMergedDoc
              }))

              // then we remove all the other documents
              await Promise.all(
                docsWithSameTitle
                  .slice(1)
                  .map(async (document) => document.remove())
              )
            })
          )
        } catch (e) {
          Report.error(e)
        }
      }
    },
    [database]
  )
}
