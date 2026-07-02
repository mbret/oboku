import { dexieDb, type Profile } from "../rxdb/dexie"

export const getProfileRow = (id: string) => dexieDb.profiles.get(id)

export const putProfileRow = (row: Profile) => dexieDb.profiles.put(row)

export const deleteProfileRow = (id: string) => dexieDb.profiles.delete(id)
