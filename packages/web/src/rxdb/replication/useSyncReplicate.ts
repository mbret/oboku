import PouchDB from "pouchdb"
import { first } from "rxjs/operators"
import { authStateSignal } from "../../auth/authState"
import { API_COUCH_URI } from "../../constants"
import { RxCollection } from "rxdb"
import { syncCollections } from "./syncCollections"
import { merge, filter, map } from "rxjs"
import { useMutation, useSignalValue } from "reactjrx"

export const useSyncReplicate = () => {
  const { dbName } = useSignalValue(authStateSignal) || {}

  return useMutation({
    mutationFn: (collections: RxCollection[]) => {
      const syncOptions = () => ({
        remote: new PouchDB(`${API_COUCH_URI}/${dbName}`, {
          fetch: (url, opts) => {
            const token = authStateSignal.getValue()?.token

            ;(opts?.headers as unknown as Map<string, string>).set(
              "Authorization",
              token ? `Bearer ${token}` : ``
            )
            return PouchDB.fetch(url, opts)
          }
        }),
        direction: {
          push: true
        },
        options: {
          retry: false,
          live: false,
          timeout: 5000
        }
      })

      const state = syncCollections(collections, syncOptions)

      return merge(
        state.error$.pipe(
          map((error) => {
            throw error
          })
        ),
        state.complete$.pipe(
          filter((value) => value === true),
          first()
        )
      )
    }
  })
}
