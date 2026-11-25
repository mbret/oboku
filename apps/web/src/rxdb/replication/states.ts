import { signal } from "reactjrx"
import type { replicateCouchDBCollection } from "./replicateCouchDBCollection"

export type ReplicationState = ReturnType<typeof replicateCouchDBCollection>

export const syncSignal = signal({
  default: {
    active: 0,
  },
})

/**
 * The replication of each collection, by collection name, while it runs:
 * online and signed in.
 */
export const runningReplicationsSignal = signal({
  default: new Map<string, ReplicationState>(),
})
