import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client"
import { version } from "../../package.json"
import { dexieDb } from "../rxdb/dexie"

const PERSIST_KEY = "queryClient"

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
    await dexieDb.queryCachePersistence.put({ key: PERSIST_KEY, value: plain })
  },
  restoreClient: async () => {
    const row = await dexieDb.queryCachePersistence.get(PERSIST_KEY)
    // `value` is typed as `unknown` in the Dexie schema; the actual shape is
    // always a PersistedClient because persistClient is the only writer.
    return (row?.value as PersistedClient) ?? undefined
  },
  removeClient: async () => {
    await dexieDb.queryCachePersistence.delete(PERSIST_KEY)
  },
}
