import { BookDocType } from "@oboku/shared"
import { useEffect, useState } from "react"
import { useRecoilState, UnwrapRecoilValue } from "recoil"
import { RxChangeEvent, RxDocumentData } from "rxdb"
import { DeepMutable } from "rxdb/dist/types/types"
import { Report } from "../debug/report.shared"
import { useDatabase } from "../rxdb"
import { normalizedBooksState } from "./states"

/**
 * @deprecated
 */
export const useBooksInitialState = () => {
  const { db } = useDatabase()
  const [, setBooks] = useRecoilState(normalizedBooksState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      ;(async () => {
        try {
          const books = await db.book.find().exec()
          const booksAsMap = books.reduce(
            (map: UnwrapRecoilValue<typeof normalizedBooksState>, obj) => {
              const id = obj._id
              map[id] = obj.toJSON() as DeepMutable<BookDocType>

              return map
            },
            {}
          )
          setBooks(booksAsMap)

          setIsReady(true)
        } catch (e) {
          Report.error(e)
        }
      })()
    }
  }, [db, setBooks])

  return isReady
}

export const useBooksObservers = () => {
  const { db } = useDatabase()
  const [, setBooks] = useRecoilState(normalizedBooksState)

  useEffect(() => {
    db?.book.$.subscribe((changeEvent: RxChangeEvent<BookDocType>) => {
      console.warn("CHANGE EVENT", changeEvent)

      switch (changeEvent.operation) {
        case "INSERT": {
          const nonReadOnlyDocumentData =
            changeEvent.documentData as RxDocumentData<BookDocType>

          return setBooks((state) => ({
            ...state,
            [changeEvent.documentData._id]: nonReadOnlyDocumentData
          }))
        }
        case "UPDATE": {
          const nonReadOnlyDocumentData =
            changeEvent.documentData as RxDocumentData<BookDocType>

          return setBooks((state) => {
            return {
              ...state,
              [changeEvent.documentData._id]: {
                ...state[changeEvent.documentData._id]!,
                ...nonReadOnlyDocumentData
              }
            }
          })
        }
        case "DELETE": {
          return setBooks(
            ({ [changeEvent.documentId]: deletedTag, ...rest }) => rest
          )
        }
      }
    })

    // @todo cleanup observers
  }, [db, setBooks])
}
