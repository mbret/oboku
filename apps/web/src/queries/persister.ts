import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client"
import { dexieDb } from "../rxdb/dexie"

const PERSIST_KEY = "queryClient"

export const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await dexieDb.queryCachePersistence.put({ key: PERSIST_KEY, value: client })
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
