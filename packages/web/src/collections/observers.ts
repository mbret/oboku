import { useEffect, useState } from "react"
import { useRecoilState, UnwrapRecoilValue } from "recoil"
import { RxChangeEvent, RxDocumentData } from "rxdb"
import { useDatabase } from "../rxdb"
import { CollectionDocType } from "@oboku/shared"
import { normalizedCollectionsState } from "./states"
import { Report } from "../debug/report.shared"
import { DeepMutable } from "rxdb/dist/types/types"

export const useCollectionsInitialState = () => {
  const { db } = useDatabase()
  const [, setCollections] = useRecoilState(normalizedCollectionsState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      ;(async () => {
        try {
          const collections = await db.obokucollection.find().exec()
          const collectionsAsMap = collections.reduce(
            (
              map: UnwrapRecoilValue<typeof normalizedCollectionsState>,
              obj
            ) => {
              map[obj._id] = obj.toJSON() as DeepMutable<CollectionDocType>
              return map
            },
            {}
          )
          setCollections(collectionsAsMap)

          setIsReady(true)
        } catch (e) {
          Report.error(e)
        }
      })()
    }
  }, [db, setCollections])

  return isReady
}

export const useCollectionsObservers = () => {
  const { db } = useDatabase()
  const [, setCollections] = useRecoilState(normalizedCollectionsState)

  useEffect(() => {
    const sub = db?.obokucollection.$.subscribe(
      (changeEvent: RxChangeEvent<CollectionDocType>) => {
        console.warn("CHANGE EVENT", changeEvent)
        switch (changeEvent.operation) {
          case "INSERT": {
            const nonReadOnlyDocumentData =
              changeEvent.documentData as RxDocumentData<CollectionDocType>

            return setCollections((state) => ({
              ...state,
              [changeEvent.documentData._id]: nonReadOnlyDocumentData
            }))
          }
          case "UPDATE": {
            const nonReadOnlyDocumentData =
              changeEvent.documentData as RxDocumentData<CollectionDocType>

            return setCollections((state) => ({
              ...state,
              [changeEvent.documentData._id]: nonReadOnlyDocumentData
            }))
          }
          case "DELETE": {
            return setCollections(
              ({ [changeEvent.documentId]: deletedCollection, ...rest }) => rest
            )
          }
        }
      }
    )

    return () => sub?.unsubscribe()
  }, [db, setCollections])
}
