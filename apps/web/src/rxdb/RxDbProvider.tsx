import { memo, useEffect } from "react"
import { type Database, createDatabase } from "./databases.shared"
import { isDefined, signal, useMutation$, useSignalValue } from "reactjrx"
import { filter, first, from, map, of, switchMap, tap } from "rxjs"
import { Logger } from "./logger"

const databaseSignal = signal<Database | undefined>({
  key: "databaseState",
})

export const latestDatabase$ = databaseSignal.pipe(filter(isDefined))

export const getLatestDatabase = () => latestDatabase$.pipe(first())

export const useReCreateDb = () => {
  return useMutation$({
    mutationKey: ["recreateDb"],
    scope: {
      id: "recreateDb",
    },
    mutationFn: ({ overwrite = true }: { overwrite?: boolean } = {}) => {
      const db = databaseSignal.getValue()

      Logger.log(`Recreating database`, { overwrite, dbExists: !!db })

      // soft create
      if (!overwrite && db) return of(null)

      databaseSignal.update(undefined)

      const start$ = db ? from(db.remove()).pipe(map(() => null)) : of(null)

      // at this point we expect useDatabase to be rendered
      // again with undefined database. So that nothing should interact with
      // the db while it's being recreated
      return start$.pipe(
        switchMap(() => createDatabase({})),
        tap((newDb) => {
          const clearSignalWhenDatabaseCloses = () => {
            Logger.log(`Database onClose event received`)

            if (databaseSignal.getValue() !== newDb) return

            databaseSignal.update(undefined)
          }

          newDb.onClose.push(clearSignalWhenDatabaseCloses)

          databaseSignal.update(newDb)
        }),
      )
    },
  })
}

export const useDatabase = () => {
  const db = useSignalValue(databaseSignal)

  return { db }
}

export const RxDbProvider = memo(() => {
  const { mutate: createDb } = useReCreateDb()

  useEffect(() => {
    createDb({ overwrite: false })
  }, [createDb])

  return null
})
