import { Logger } from "../debug/logger.shared"
import { RXDB_DATABASE_NAME } from "./constants.shared"

const RXDB_INDEXED_DB_NAME_PREFIX = "rxdb-dexie-"

const parseDatabaseVersion = (databaseName: string) => {
  const match = /^(.*)-(\d+)$/.exec(databaseName)

  if (!match) {
    return null
  }

  const [, prefix, versionString] = match
  const version = Number(versionString)

  if (!Number.isInteger(version) || version < 1) {
    return null
  }

  return {
    prefix,
    version,
  }
}

const parseIndexedDbRxDatabaseVersion = (databaseName: string) => {
  if (!databaseName.startsWith(RXDB_INDEXED_DB_NAME_PREFIX)) {
    return null
  }

  const logicalDatabaseName = databaseName
    .slice(RXDB_INDEXED_DB_NAME_PREFIX.length)
    .split("--")[0]

  if (!logicalDatabaseName) {
    return null
  }

  return parseDatabaseVersion(logicalDatabaseName)
}

const deleteIndexedDbDatabase = (databaseName: string) =>
  new Promise<boolean>((resolve) => {
    const request = indexedDB.deleteDatabase(databaseName)

    request.onsuccess = () => {
      resolve(true)
    }

    request.onerror = () => {
      Logger.info(
        `[rxdb]`,
        `failed to delete legacy rxdb dexie database`,
        databaseName,
      )
      resolve(false)
    }

    request.onblocked = () => {
      Logger.info(
        `[rxdb]`,
        `legacy rxdb dexie database deletion blocked`,
        databaseName,
      )
      resolve(false)
    }
  })

/**
 * Deletes old Dexie-backed RxDB IndexedDB databases that belong to previous
 * logical RxDB database versions so they do not accumulate across upgrades.
 *
 * This runs from the service worker as a best-effort background task and only
 * targets IndexedDB database names created by RxDB Dexie storage, such as
 * `rxdb-dexie-oboku-49--0--book`.
 */
export const cleanupOldRxdbDatabases = async () => {
  if (typeof indexedDB === "undefined") {
    return
  }

  const parsedDatabaseVersion = parseDatabaseVersion(RXDB_DATABASE_NAME)

  if (!parsedDatabaseVersion) {
    return
  }

  const { prefix, version } = parsedDatabaseVersion

  if (!("databases" in indexedDB)) {
    Logger.info(
      `[rxdb]`,
      `indexedDB.databases() unavailable, expected legacy rxdb dexie databases`,
      Array.from({ length: version - 1 }, (_, index) => {
        return `${RXDB_INDEXED_DB_NAME_PREFIX}${prefix}-${index + 1}--...`
      }),
    )
    return
  }

  const databases = await indexedDB.databases()
  const legacyDatabaseNames = databases
    .map((entry) => entry.name)
    .filter((name): name is string => typeof name === "string")
    .map((name) => ({
      name,
      parsedName: parseIndexedDbRxDatabaseVersion(name),
    }))
    .filter((entry) => {
      const { parsedName } = entry

      if (!parsedName) {
        return false
      }

      return parsedName.prefix === prefix && parsedName.version < version
    })

  const matchedVersions = Array.from(
    new Set(
      legacyDatabaseNames
        .map((entry) => entry.parsedName?.version)
        .filter((value): value is number => typeof value === "number"),
    ),
  ).sort((left, right) => left - right)

  const deletedResults = await Promise.all(
    legacyDatabaseNames.map((entry) => deleteIndexedDbDatabase(entry.name)),
  )
  const deletedCount = deletedResults.reduce(
    (count, didDelete) => (didDelete ? count + 1 : count),
    0,
  )

  Logger.info(`[rxdb]`, `deleted legacy rxdb dexie databases`, {
    deletedCount,
    matchedVersions,
    currentVersion: version,
  })
}
