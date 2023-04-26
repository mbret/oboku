import { useCallback, useEffect, useState } from "react"
import { useMountedState } from "react-use"
import { Database, createDatabase } from "./databases"
import { signal } from "reactjrx"
import { isNotNullOrUndefined } from "../common/isNotNullOrUndefined"
import { shareReplay } from "rxjs"

/**
 * Make sure to use lazy one time db creation
 */
let dbPromise: ReturnType<typeof createDatabase> | undefined = undefined

export const [, setDatabase, , database$] = signal<Database | undefined>({
  key: "databaseState"
})

export const latestDatabase$ = database$.pipe(
  isNotNullOrUndefined(),
  shareReplay(1)
)

export const useCreateDatabase = () => {
  const [db, setDb] = useState<Awaited<typeof dbPromise>>()
  const isMounted = useMountedState()

  const reCreate = useCallback(async () => {
    setDb(undefined)
    setDatabase(undefined)
    // at this point we expect useDatabase to be rendered
    // again with undefined database. So that nothing should interact with
    // the db while it's being recreated
    await db?.remove()
    const newDb = await createDatabase()

    if (isMounted()) {
      setDb(newDb)
      setDatabase(newDb)
    }

    return newDb
  }, [db, isMounted])

  useEffect(() => {
    ;(async () => {
      if (!dbPromise) {
        dbPromise = createDatabase()
      }

      const db = await dbPromise

      setDb(db)
      setDatabase(db)
    })()
  }, [setDb, isMounted])

  // @ts-ignore
  window.db = db

  return { db, reCreate }
}
