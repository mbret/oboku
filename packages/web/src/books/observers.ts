import { BookDocType } from "@oboku/shared"
import { useEffect, useState } from "react"
import { useRecoilState, UnwrapRecoilValue } from "recoil"
import { RxChangeEvent } from "rxdb"
import { Report } from "../debug/report.shared"
import { useDatabase } from "../rxdb"
import { normalizedBooksState } from "./states"

export const useBooksInitialState = () => {
  const db = useDatabase()
  const [, setBooks] = useRecoilState(normalizedBooksState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      (async () => {
        try {
          const books = await db.book.find().exec()
          const booksAsMap = books.reduce((map: UnwrapRecoilValue<typeof normalizedBooksState>, obj) => {
            map[obj._id] = obj.toJSON()

            return map
          }, {})
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
  const db = useDatabase()
  const [, setBooks] = useRecoilState(normalizedBooksState)

  useEffect(() => {
    db?.book.$.subscribe((changeEvent: RxChangeEvent<BookDocType>) => {
      console.warn('CHANGE EVENT', changeEvent)

      switch (changeEvent.operation) {
        case 'INSERT': {
          return setBooks(state => ({
            ...state,
            [changeEvent.documentData._id]: changeEvent.documentData
          }))
        }
        case 'UPDATE': {
          return setBooks(state => {
            return {
              ...state,
              [changeEvent.documentData._id]: {
                ...state[changeEvent.documentData._id]!,
                ...changeEvent.documentData,
              },
            }
          })
        }
        case 'DELETE': {
          return setBooks(({ [changeEvent.documentData._id]: deletedTag, ...rest }) => rest)
        }
      }
    })
  }, [db, setBooks])
}

