import { useEffect } from "react"
import { API_COUCH_URI } from "../constants"
import { Report } from "../report"
import PouchDB from 'pouchdb'
import { useRecoilValue } from "recoil"
import { authState } from "../auth/authState"

/**
 * For now we only delete whatever revision is in conflict.
 */
export const useWatchAndFixConflicts = () => {
  const { token, dbName } = useRecoilValue(authState) || {}

  useEffect(() => {
    if (!token) return

    const db = new PouchDB(`${API_COUCH_URI}/${dbName}`, {
      fetch: (url, opts) => {
        (opts?.headers as unknown as Map<string, string>).set('Authorization', `Bearer ${token}`)
        return PouchDB.fetch(url, opts)
      }
    })

    // @todo retry automatically in case of failure

    const listener = db
      .changes({ conflicts: true, live: true, since: 'now', include_docs: true, })
      .on('change', async (change) => {
        try {
          if (change.doc?._id && change.doc._conflicts && change.doc?._conflicts.length > 0) {
            const docId = change.doc._id
            await Promise.all(change.doc?._conflicts.map(async (rev) => {
              console.warn(`conflict detected for doc ${docId} with revision ${rev}. Trying to delete conflict revision`)
              return db.remove(docId, rev)
            }))
          }
        } catch (e) {
          Report.error(e)
        }
      })
      .on('error', Report.error)

    return () => {
      listener.cancel()
    }
  }, [token, dbName])
}