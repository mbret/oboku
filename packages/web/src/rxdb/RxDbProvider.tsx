import { memo, useEffect } from "react"
import { Database, createDatabase } from "./databases"
import { isDefined, signal, useMutation$, useSignalValue } from "reactjrx"
import { filter, first, from, map, of, switchMap, tap } from "rxjs"

const databaseSignal = signal<Database | undefined>({
  key: "databaseState"
})

export const latestDatabase$ = databaseSignal.subject.pipe(filter(isDefined))

export const getLatestDatabase = () => latestDatabase$.pipe(first())

export const useReCreateDb = () => {
  return useMutation$({
    mutationKey: ["recreateDb"],
    scope: {
      id: "recreateDb"
    },
    mutationFn: ({ overwrite = true }: { overwrite?: boolean } = {}) => {
      const db = databaseSignal.getValue()

      // soft create
      if (!overwrite && db) return of(null)

      databaseSignal.setValue(undefined)

      const start$ = db ? from(db?.remove()).pipe(map(() => null)) : of(null)

      // at this point we expect useDatabase to be rendered
      // again with undefined database. So that nothing should interact with
      // the db while it's being recreated
      return start$.pipe(
        switchMap(() => from(createDatabase({}))),
        tap((newDb) => {
          databaseSignal.setValue(newDb)
        })
      )
    }
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
