import { useEffect } from "react"
import { useAuth } from "../auth/helpers"
import { API_SYNC_URL } from "../constants"
import { Report } from "../report"
import PouchDB from 'pouchdb'

/**
 * For now we only delete whatever revision is in conflict.
 */
export const useWatchAndFixConflicts = () => {
  const { token } = useAuth() || {}
  
  useEffect(() => {
    if (!token) return

    const db = new PouchDB(API_SYNC_URL, {
      fetch: (url, opts) => {
        (opts?.headers as unknown as Map<string, string>).set('Authorization', `Bearer ${token}`)
        return PouchDB.fetch(url, opts)
      }
    })

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
  }, [token])
}