import { useCallback } from "react"
import { useRecoilValue } from "recoil"
import { PouchDB } from "rxdb"
import { first } from "rxjs/operators"
import { authState } from "../auth/authState"
import { useAxiosClient } from "../axiosClient"
import { API_COUCH_URI } from "../constants"
import { useDatabase } from "./RxDbProvider"

export const useSync = () => {
  const database = useDatabase()
  const client = useAxiosClient()
  const { dbName } = useRecoilValue(authState) || {}

  type CollectionNames = Parameters<NonNullable<typeof database>['sync']>[0]['collectionNames']

  return useCallback((collectionNames: CollectionNames) => {
    return new Promise<void>((resolve, reject) => {
      const replication$ = database?.sync({
        collectionNames,
        syncOptions: () => ({
          remote: new PouchDB(`${API_COUCH_URI}/${dbName}`, {
            fetch: (url, opts) => {
              (opts?.headers as unknown as Map<string, string>).set('Authorization', client.getAuthorizationHeader())
              return PouchDB.fetch(url, opts)
            }
          }),
          direction: {
            push: true,
          },
          options: {
            retry: false,
            live: false,
            // timeout: 5000,
          }
        })
      })

      replication$?.complete$
        .subscribe(isSuccess => {
          console.log('complete', isSuccess)
          isSuccess && resolve()
        })

      replication$?.error$
        .pipe(first())
        .subscribe(reject)
    })
  }, [client, dbName, database])
}