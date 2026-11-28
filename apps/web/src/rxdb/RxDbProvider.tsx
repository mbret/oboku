import { memo, useEffect } from "react"
import {
  type Database,
  createDatabase,
  removeStoredDatabase,
} from "./databases.shared"
import { isDefined, signal, useMutation$, useSignalValue } from "reactjrx"
import {
  distinctUntilChanged,
  filter,
  first,
  firstValueFrom,
  from,
  map,
} from "rxjs"
import { withDatabaseLifecycleLock } from "./databaseLifecycleLock.shared"
import { Logger } from "./logger"

type DatabaseState = {
  openDatabase: Database | undefined
  pendingReplacements: number
}

/**
 * `openDatabase` changes only while the tab holds the database lifecycle lock,
 * or when the instance closes.
 */
const databaseStateSignal = signal<DatabaseState>({
  key: "databaseState",
  default: { openDatabase: undefined, pendingReplacements: 0 },
})

const selectUsableDatabase = ({
  openDatabase,
  pendingReplacements,
}: DatabaseState) => {
  const isOpenDatabaseStale = pendingReplacements > 0

  return isOpenDatabaseStale ? undefined : openDatabase
}

export const latestDatabase$ = databaseStateSignal.pipe(
  map(selectUsableDatabase),
  distinctUntilChanged(),
  filter(isDefined),
)

export const getLatestDatabase = () => latestDatabase$.pipe(first())

const setOpenDatabase = (openDatabase: Database | undefined) => {
  databaseStateSignal.update(function withOpenDatabase(state) {
    return { ...state, openDatabase }
  })
}

const addToPendingReplacements = (difference: 1 | -1) => {
  databaseStateSignal.update(function withPendingReplacements(state) {
    return {
      ...state,
      pendingReplacements: state.pendingReplacements + difference,
    }
  })
}

const openDatabase = async () => {
  const database = await firstValueFrom(createDatabase({}))

  database.onClose.push(function forgetDatabaseWhenItCloses() {
    Logger.log(`Database onClose event received`)

    const isTrackedAsOpen =
      databaseStateSignal.getValue().openDatabase === database

    if (isTrackedAsOpen) setOpenDatabase(undefined)
  })

  setOpenDatabase(database)

  return database
}

/**
 * Makes `useDatabase` and `latestDatabase$` give no database at once, so that
 * nothing starts to use the open one. Then, in turn with the other tabs and
 * with the other calls of this tab, disposes of the open database and opens a
 * new instance. If a step fails, the tab stays without a database.
 */
const replaceDatabase = (
  disposeOf: (staleDatabase: Database | undefined) => Promise<unknown>,
) => {
  addToPendingReplacements(1)

  return withDatabaseLifecycleLock(async function disposeThenOpen() {
    try {
      const { openDatabase: staleDatabase } = databaseStateSignal.getValue()

      setOpenDatabase(undefined)
      await disposeOf(staleDatabase)

      return await openDatabase()
    } finally {
      addToPendingReplacements(-1)
    }
  })
}

const wipeDatabase = () =>
  replaceDatabase(async function removeStoredData(staleDatabase) {
    if (staleDatabase) return staleDatabase.remove()

    return removeStoredDatabase()
  })

const openDatabaseIfClosed = () =>
  withDatabaseLifecycleLock(async function openUnlessOpen() {
    return databaseStateSignal.getValue().openDatabase ?? openDatabase()
  })

/**
 * Closes this tab's database and opens a new instance over the stored data,
 * which it keeps. For a tab whose stored data another tab replaced: the open
 * instance still holds the previous documents in memory, and a write through
 * one of them stores that document again. `useDatabase` gives no database from
 * the call until the new instance is open.
 */
export const reopenDatabase = () =>
  replaceDatabase(async function closeStaleDatabase(staleDatabase) {
    await staleDatabase?.close()
  })

export const useReCreateDb = () => {
  return useMutation$({
    mutationKey: ["recreateDb"],
    meta: { survivesSessionReset: true },
    mutationFn: ({ overwrite = true }: { overwrite?: boolean } = {}) => {
      Logger.log(`Recreating database`, { overwrite })

      return from(overwrite ? wipeDatabase() : openDatabaseIfClosed())
    },
  })
}

export const useDatabase = () => {
  const db = useSignalValue(databaseStateSignal, selectUsableDatabase)

  return { db }
}

/**
 * The `db` of `useDatabase`, for a write that cannot run without it. Throws
 * while no database is open.
 */
export const ensureDatabase = (db: Database | undefined) => {
  if (!db) throw new Error("The database is not open")

  return db
}

export const RxDbProvider = memo(function RxDbProvider() {
  const { mutate: createDb } = useReCreateDb()

  useEffect(() => {
    createDb({ overwrite: false })
  }, [createDb])

  return null
})
