import { dexieDb } from "../rxdb/dexie"
import type { Profile } from "./types"

export const putProfileRow = (row: Profile) => dexieDb.profiles.put(row)
