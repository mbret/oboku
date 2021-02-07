import { useEffect, useState } from "react"
import { useBooksInitialState } from "./books/observers";
import { useDatabase } from "./rxdb"
import { useTagsInitialState } from "./tags/observers";
import { useLinksInitialState } from "./links/observers";
import { useCollectionsInitialState } from "./collections/observers";
import { useDataSourcesInitialState } from "./dataSources/observers";
import { useAuthStateReducer, useSettingsStateReducer } from "./sync/useObservers";
import { Report } from "./report";

/**
 * This hook will load anything needed from the database into the state.
 * This is a pre-cache mecanism that is needed in case of there are already
 * data offline. It is only used for startup.
 */
export const useLoadInitialState = () => {
  const db = useDatabase()
  const authReducer = useAuthStateReducer();
  const settingsReducer = useSettingsStateReducer();
  const isBookStateReady = useBooksInitialState()
  const isTagStateReady = useTagsInitialState()
  const isLinkStateReady = useLinksInitialState()
  const isCollectionStateReady = useCollectionsInitialState()
  const isDataSourceStateReady = useDataSourcesInitialState()
  const [ready, setIsReady] = useState(false)

  useEffect(() => {
    if (db) {
      (async () => {
        try {
          const auth = await db.auth.findOne().exec()
          auth && authReducer({ operation: 'INIT', documentData: auth })

          const settings = await db.settings.findOne().exec()
          settings && settingsReducer({ operation: 'INIT', documentData: settings })

          setIsReady(true)
        } catch (e) {
          Report.error(e)
        }
      })()
    }
  }, [db, authReducer, settingsReducer])

  return ready && isBookStateReady && isTagStateReady && isLinkStateReady && isCollectionStateReady && isDataSourceStateReady
}