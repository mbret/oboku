import { useEffect, useMemo } from "react"
import { API_COUCH_URI } from "../../constants"
import { Report } from "../../debug/report.shared"
import PouchDB from "pouchdb"
import { useAuthState } from "../../auth/authState"
import { useNetworkState } from "react-use"
import { defer, EMPTY, from, throwError } from "rxjs"
import { catchError, switchMap } from "rxjs/operators"
import { isPouchError } from "../utils"
import { retryBackoff } from "reactjrx"

const getDb = (dbName: string, token: string) =>
  new PouchDB(`${API_COUCH_URI}/${dbName}`, {
    fetch: (url, opts) => {
      ;(opts?.headers as unknown as Map<string, string>).set(
        "Authorization",
        `Bearer ${token}`
      )
      return PouchDB.fetch(url, opts)
    }
  })

const useWatchForLiveConflicts = (db: PouchDB.Database<{}> | undefined) => {
  const network = useNetworkState()

  useEffect(() => {
    if (!db || !network.online) return

    // @todo retry automatically in case of failure

    const listener = db
      .changes({
        conflicts: true,
        live: true,
        since: "now",
        include_docs: true
      })
      .on("change", async (change) => {
        try {
          if (
            change.doc?._id &&
            change.doc._conflicts &&
            change.doc?._conflicts.length > 0
          ) {
            const docId = change.doc._id
            await Promise.all(
              change.doc?._conflicts.map(async (rev) => {
                console.warn(
                  `conflict detected for doc ${docId} with revision ${rev}. Trying to delete conflict revision`
                )
                return db.remove(docId, rev)
              })
            )
          }
        } catch (e) {
          Report.error(e)
        }
      })
      .on("error", Report.error)

    return () => {
      listener.cancel()
    }
  }, [db, network])
}

/**
 * This run at least once when the user start the app.
 * then run every time he switch network status.
 *
 * This should be enough for most cases since we already have a live listener for the change feed.
 */
const useTryToResolveOldRemainingConflicts = (
  db: PouchDB.Database<{}> | undefined
) => {
  const { online } = useNetworkState()

  useEffect(() => {
    if (!db || !online) return

    const createView$ = defer(() =>
      from(
        db.put({
          _id: "_design/conflict_docs",
          views: {
            all: {
              map: `function (doc) { if(doc._conflicts) { emit(doc._id, doc._conflicts); } }`
            }
          }
        })
      )
    ).pipe(
      retryBackoff({
        initialInterval: 100,
        shouldRetry: (_, err) =>
          !isPouchError(err) || (err.status || 500) >= 500
      })
    )

    const conflicts$ = defer(() =>
      from(db.query(`conflict_docs/all`, { include_docs: true }))
    ).pipe(
      retryBackoff({
        initialInterval: 100,
        shouldRetry: (_, err) =>
          !isPouchError(err) || (err.status || 500) >= 500
      })
    )

    const view$ = defer(() => from(db.get("_design/conflict_docs"))).pipe(
      retryBackoff({
        initialInterval: 100,
        shouldRetry: (_, err) =>
          !isPouchError(err) || (err.status || 500) >= 500
      })
    )

    const conflictResolver$ = view$
      .pipe(
        catchError((err) => {
          if (err.status === 404) {
            return createView$
          }

          return throwError(err)
        }),
        switchMap(() => conflicts$),
        switchMap((response) => {
          if (response.total_rows > 0) {
            return from(
              Promise.all(
                response.rows.map(async (row) => {
                  const docId = row.id
                  const conflicts = row.value as string[]
                  return Promise.all(
                    conflicts.map(async (rev) => {
                      console.warn(
                        `conflict detected for doc ${docId} with revision ${rev}. Trying to delete conflict revision`
                      )
                      return db.remove(docId, rev)
                    })
                  )
                })
              )
            )
          }

          return EMPTY
        }),
        catchError((err) => {
          Report.error(err)

          return EMPTY
        })
      )
      .subscribe()

    return () => {
      conflictResolver$.unsubscribe()
    }
  }, [db, online])
}

export const useWatchAndFixConflicts = () => {
  const { token, dbName } = useAuthState() || {}
  const db = useMemo(() => {
    if (!token || !dbName) return undefined
    return getDb(dbName, token)
  }, [token, dbName])

  useWatchForLiveConflicts(db)
  useTryToResolveOldRemainingConflicts(db)
}

// setTimeout(() => {
//   db.bulkDocs([{
//     "_id": "sa3uvuuq8i:1616921818059",
//     "_rev": "1-8",
//     "name": (new Date().getTime()).toString(),
//     "books": [],
//     "isProtected": false,
//     "createdAt": "2021-03-28T08:56:58.058Z",
//     "modifiedAt": null,
//     "rx_model": "tag"
//   },
//   {
//     "_id": "sa3uvuuq8i:1616921818059",
//     "_rev": "1-9",
//     "name": (new Date().getTime() + 1).toString(),
//     "books": [],
//     "isProtected": false,
//     "createdAt": "2021-03-28T08:56:58.058Z",
//     "modifiedAt": null,
//     "rx_model": "tag"
//   }], { new_edits: false }).then(response => {
//     console.log('FOOOO', response)
//   }).catch(err => {
//     console.log('FOOOO', err)
//   })
// }, 5000)
