import { useEffect, useState } from "react"
import { useRecoilState, UnwrapRecoilValue } from "recoil"
import { RxChangeEvent, RxDocumentData } from "rxdb"
import { useDatabase } from "../rxdb"
import { TagsDocType } from "@oboku/shared"
import { normalizedTagsState } from "./states"
import { Report } from "../debug/report.shared"
import { DeepMutable } from "rxdb/dist/types/types"

export const useTagsInitialState = () => {
  const db = useDatabase()
  const [, setTags] = useRecoilState(normalizedTagsState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      ;(async () => {
        try {
          const tags = await db.tag.find().exec()
          const tagsAsMap = tags.reduce(
            (map: UnwrapRecoilValue<typeof normalizedTagsState>, obj) => {
              map[obj._id] = obj.toJSON() as DeepMutable<TagsDocType>

              return map
            },
            {}
          )
          setTags(tagsAsMap)

          setIsReady(true)
        } catch (e) {
          Report.error(e)
        }
      })()
    }
  }, [db, setTags])

  return isReady
}

export const useTagsObservers = () => {
  const db = useDatabase()
  const [, setTags] = useRecoilState(normalizedTagsState)

  useEffect(() => {
    db?.tag.$.subscribe((changeEvent: RxChangeEvent<TagsDocType>) => {
      console.warn("CHANGE EVENT", changeEvent)
      switch (changeEvent.operation) {
        case "INSERT": {
          const nonReadOnlyDocumentData =
            changeEvent.documentData as RxDocumentData<TagsDocType>

          return setTags((state) => ({
            ...state,
            [changeEvent.documentData._id]: nonReadOnlyDocumentData
          }))
        }
        case "UPDATE": {
          const nonReadOnlyDocumentData =
            changeEvent.documentData as RxDocumentData<TagsDocType>

          return setTags((state) => ({
            ...state,
            [changeEvent.documentData._id]: nonReadOnlyDocumentData
          }))
        }
        case "DELETE": {
          return setTags(
            ({ [changeEvent.documentId]: deletedTag, ...rest }) => rest
          )
        }
      }
    })
  }, [db, setTags])
}
