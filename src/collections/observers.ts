import { useEffect, useState } from "react"
import { useRecoilState, UnwrapRecoilValue } from "recoil"
import { RxChangeEvent } from "rxdb"
import { useDatabase } from "../rxdb"
import { CollectionDocType } from 'oboku-shared'
import { normalizedCollectionsState } from "./states"
import { Report } from "../report"

export const useCollectionsInitialState = () => {
  const db = useDatabase()
  const [, setCollections] = useRecoilState(normalizedCollectionsState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      (async () => {
        try {
          const collections = await db.obokucollection.find().exec()
          const collectionsAsMap = collections.reduce((map: UnwrapRecoilValue<typeof normalizedCollectionsState>, obj) => {
            map[obj._id] = obj.toJSON()
            return map
          }, {})
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
  const db = useDatabase()
  const [, setCollections] = useRecoilState(normalizedCollectionsState)

  useEffect(() => {
    db?.obokucollection.$.subscribe((changeEvent: RxChangeEvent<CollectionDocType>) => {
      console.warn('CHANGE EVENT', changeEvent)
      switch (changeEvent.operation) {
        case 'INSERT': {
          return setCollections(state => ({
            ...state,
            [changeEvent.documentData._id]: changeEvent.documentData,
          }))
        }
        case 'UPDATE': {
          return setCollections(state => ({
            ...state,
            [changeEvent.documentData._id]: changeEvent.documentData,
          }))
        }
        case 'DELETE': {
          return setCollections(({ [changeEvent.documentData._id]: deletedCollection, ...rest }) => rest)
        }
      }
    })
  }, [db, setCollections])
}