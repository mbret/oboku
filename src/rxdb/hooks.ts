
// export const useRxQuery = <D extends DocTypes, R extends RxQuery<AuthDocType, RxDocument<AuthDocType, any> | null>>(
// export function useRxQuery<D extends DocTypes>(
//   queryCb: (db: RxDatabase<MyDatabaseCollections>) => RxQuery<D, RxDocument<D, {}>[]>

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RxDatabase, RxQuery } from "rxdb"
import { Subscription } from "rxjs"
import type { DocTypes, MyDatabaseCollections } from "../databases"
import { PromiseReturnType } from "../types"
import { useDatabase } from "./databases"

// ): PromiseReturnType<NonNullable<ReturnType<NonNullable<typeof queryCb>>>['exec']>
export function useRxQuery<D extends DocTypes, R extends D | null | D[]>(
  queryCb: (db: RxDatabase<MyDatabaseCollections>) => RxQuery<D, R>
) {
  type Result = PromiseReturnType<NonNullable<ReturnType<NonNullable<typeof queryCb>>>['exec']>
  const db = useDatabase()
  const [res, setRes] = useState<Result | undefined>()
  const query = db && queryCb(db)
  const queryAsString = query?.toString()
  console.log(queryAsString)
  const [, setInc] = useState(0) // used to force render
  const queryCbRef = useRef(queryCb)
  queryCbRef.current = queryCb
  const memoizedQuery = useMemo(() => {
    return !!queryAsString && db ? queryCbRef.current(db) : undefined
  }, [db, queryAsString])

  useEffect(() => {
    let $sub: Subscription | undefined

    if (db) {
      console.log('RUN QUERY')

      $sub = memoizedQuery?.$.subscribe(results => {
        console.log('RUN QUERY changes', results)
        setRes(results)
        setInc(inc => inc + 1)
      });

      (async () => {
        try {
          const result = await memoizedQuery?.exec()
          console.log('RUN QUERY results', result)
          setRes(result)
          setInc(inc => inc + 1)
        } catch (e) {
          console.error(e)
        }
      })()
    }

    return () => {
      console.log('RUN QUERY unsubscribe')
      $sub?.unsubscribe()
    }
  }, [db, memoizedQuery])

  return res
}

// export function useRxMutation (
//   query: (database: RxDatabase<MyDatabaseCollections>) => Promise<any> | undefined,
// ): any
export function useRxMutation(
  query: (database: RxDatabase<MyDatabaseCollections>, options: {}) => Promise<any> | undefined
): [() => Promise<any>, any]
export function useRxMutation<V>(
  query: (database: RxDatabase<MyDatabaseCollections>, options: { variables: V }) => Promise<any> | undefined
): [(variables: V) => Promise<any>, any]
export function useRxMutation(query) {
  const db = useDatabase()
  const dbRef = useRef(db)
  const [error, setError] = useState()
  dbRef.current = db

  const cb = useCallback(async (variables?: any) => {
    if (dbRef.current) {
      return await query(dbRef.current, { variables })
    } else {
      throw new Error('DB not initialized')
    }
  }, [query])

  const cbRef = useRef(async (...args) => cb(...args)).current

  const data = { error }

  return [cbRef, data] as [typeof cbRef, typeof data]
}