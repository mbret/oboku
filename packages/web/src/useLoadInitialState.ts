import { useEffect, useState } from "react"
import { useBooksInitialState } from "./books/observers"
import { useDatabase } from "./rxdb"
import { useLinksInitialState } from "./links/observers"
import { useCollectionsInitialState } from "./collections/observers"
import { useSettingsStateReducer } from "./rxdb/sync/useObservers"
import { Report } from "./debug/report.shared"

/**
 * This hook will load anything needed from the database into the state.
 * This is a pre-cache mecanism that is needed in case of there are already
 * data offline. It is only used for startup.
 */
export const useLoadInitialState = () => {
  const { db } = useDatabase()
  const settingsReducer = useSettingsStateReducer()
  const isBookStateReady = useBooksInitialState()
  const isLinkStateReady = useLinksInitialState()
  const isCollectionStateReady = useCollectionsInitialState()
  const [ready, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      ;(async () => {
        try {
          const settings = await db.settings.findOne().exec()
          settings &&
            settingsReducer({ operation: "INIT", documentData: settings })

          setIsReady(true)
        } catch (e) {
          Report.error(e)
        }
      })()
    }
  }, [db, settingsReducer])

  return ready && isBookStateReady && isLinkStateReady && isCollectionStateReady
}
