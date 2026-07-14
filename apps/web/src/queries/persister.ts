import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client"
import { version } from "../../package.json"
import { dexieDb } from "../rxdb/dexie"

const PERSIST_KEY = "queryCache.persistedClient"

/**
 * Cache namespace for persisted queries/mutations. Bumped per release so state
 * persisted by an older build is discarded on restore instead of rehydrated.
 * Shared by every writer (the provider and any manual `persistQueryClientSave`)
 * so a snapshot always survives restore.
 */
export const persistBuster = version

export const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    // IndexedDB structured clone rejects values like `AbortSignal` that can end
    // up in dehydrated query state (e.g. fetch meta / in-flight work). JSON
    // round-trip keeps only serializable plain data for Dexie.
    const plain: PersistedClient = JSON.parse(JSON.stringify(client))
    await dexieDb.keyValue.put({ key: PERSIST_KEY, value: plain })
  },
  restoreClient: async () => {
    const entry = await dexieDb.keyValue.get(PERSIST_KEY)

    return entry?.value
  },
  removeClient: async () => {
    await dexieDb.keyValue.delete(PERSIST_KEY)
  },
}
