import { useEffect, useState } from "react"
import { useRecoilState, UnwrapRecoilValue } from "recoil"
import { RxChangeEvent } from "rxdb"
import { useDatabase } from "../rxdb"
import { LinkDocType } from "@oboku/shared"
import { normalizedLinksState } from "./states"
import { Report } from "../debug/report.shared"

export const useLinksInitialState = () => {
  const db = useDatabase()
  const [, setLinks] = useRecoilState(normalizedLinksState)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      ;(async () => {
        try {
          const links = await db.link.find().exec()
          const linksAsMap = links.reduce(
            (map: UnwrapRecoilValue<typeof normalizedLinksState>, obj) => {
              map[obj._id] = obj.toJSON()
              return map
            },
            {}
          )
          setLinks(linksAsMap)

          setIsReady(true)
        } catch (e) {
          Report.error(e)
        }
      })()
    }
  }, [db, setLinks])

  return isReady
}

export const useLinksObservers = () => {
  const db = useDatabase()
  const [, setLinks] = useRecoilState(normalizedLinksState)

  useEffect(() => {
    const subscription = db?.link.$.subscribe(
      (changeEvent: RxChangeEvent<LinkDocType>) => {
        Report.log(`links.observer`, `RxChangeEvent`, changeEvent)

        switch (changeEvent.operation) {
          case "INSERT": {
            return setLinks((state) => ({
              ...state,
              [changeEvent.documentData._id]: changeEvent.documentData
            }))
          }
          case "UPDATE": {
            return setLinks((state) => ({
              ...state,
              [changeEvent.documentData._id]: changeEvent.documentData
            }))
          }
          case "DELETE": {
            return setLinks(
              ({ [changeEvent.documentData._id]: deletedTag, ...rest }) => rest
            )
          }
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [db, setLinks])
}
