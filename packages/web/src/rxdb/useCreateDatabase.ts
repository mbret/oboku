import { useCallback, useEffect, useState } from "react"
import { useMountedState } from "react-use"
import { Database, createDatabase } from "./databases"
import { isDefined, signal } from "reactjrx"
import { filter, shareReplay } from "rxjs"

/**
 * Make sure to use lazy one time db creation
 */
let dbPromise: ReturnType<typeof createDatabase> | undefined = undefined

export const databaseSignal = signal<Database | undefined>({
  key: "databaseState"
})

export const latestDatabase$ = databaseSignal.subject.pipe(
  filter(isDefined),
  shareReplay(1)
)

export const useCreateDatabase = () => {
  const [db, setDb] = useState<Awaited<typeof dbPromise>>()
  const isMounted = useMountedState()

  const reCreate = useCallback(async () => {
    setDb(undefined)
    databaseSignal.setValue(undefined)
    // at this point we expect useDatabase to be rendered
    // again with undefined database. So that nothing should interact with
    // the db while it's being recreated
    await db?.remove()
    const newDb = await createDatabase()

    if (isMounted()) {
      setDb(newDb)
      databaseSignal.setValue(newDb)
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
      databaseSignal.setValue(db)
    })()
  }, [setDb, isMounted])

  // @ts-ignore
  window.db = db

  return { db, reCreate }
}
