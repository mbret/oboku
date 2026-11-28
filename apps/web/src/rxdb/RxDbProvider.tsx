import { memo, useEffect } from "react"
import { removeRxDatabase } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { type Database, createDatabase } from "./databases.shared"
import { isDefined, signal, useMutation$, useSignalValue } from "reactjrx"
import { filter, first, firstValueFrom, from } from "rxjs"
import { RXDB_DATABASE_NAME } from "./constants.shared"
import { withDatabaseLifecycleLock } from "./databaseLifecycleLock.shared"
import { Logger } from "./logger"

const databaseSignal = signal<Database | undefined>({
  key: "databaseState",
})

export const latestDatabase$ = databaseSignal.pipe(filter(isDefined))

export const getLatestDatabase = () => latestDatabase$.pipe(first())

const takeDatabase = () => {
  const database = databaseSignal.getValue()

  databaseSignal.update(undefined)

  return database
}

const openDatabase = async () => {
  const database = await firstValueFrom(createDatabase({}))

  database.onClose.push(function clearSignalWhenDatabaseCloses() {
    Logger.log(`Database onClose event received`)

    if (databaseSignal.getValue() !== database) return

    databaseSignal.update(undefined)
  })

  databaseSignal.update(database)

  return database
}

/**
 * Takes this tab's database away at once, so that nothing uses it any more.
 * Then, in turn with the other tabs, disposes of it and opens a new instance.
 */
const replaceDatabase = (
  disposeOf: (staleDatabase: Database | undefined) => Promise<unknown>,
) => {
  const databaseOpenAtCall = takeDatabase()

  return withDatabaseLifecycleLock(async function disposeThenOpen() {
    // An earlier replacement in this tab can have opened a database while this
    // one waited for the lock.
    const staleDatabase = databaseOpenAtCall ?? takeDatabase()

    await disposeOf(staleDatabase)

    return openDatabase()
  })
}

const wipeDatabase = () =>
  replaceDatabase(async function removeStoredData(staleDatabase) {
    if (staleDatabase) return staleDatabase.remove()

    return removeRxDatabase(RXDB_DATABASE_NAME, getRxStorageDexie())
  })

const openDatabaseIfClosed = () =>
  withDatabaseLifecycleLock(async function openUnlessOpen() {
    return databaseSignal.getValue() ?? openDatabase()
  })

/**
 * Closes this tab's database and opens it again, without removing the stored
 * data. For a tab whose stored data another tab replaced: its instance still
 * holds the previous documents in memory, and a write through one of them puts
 * that document back. From the call until the new instance is open, the tab
 * has no database.
 */
export const reopenDatabase = () =>
  replaceDatabase(async function close(staleDatabase) {
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
  const db = useSignalValue(databaseSignal)

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
