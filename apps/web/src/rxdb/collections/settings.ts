import type { MigrationStrategies, RxCollection, RxJsonSchema } from "rxdb"
import type { Database } from "../databases"
import { getReplicationProperties } from "../replication/getReplicationProperties"

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type SettingsCollectionMethods = {}

export type SettingsDocType = {
  _id: "settings"
  masterEncryptionKey?: {
    salt: string
    iv: string
    data: string
  } | null
}

export type SettingsCollection = RxCollection<
  SettingsDocType,
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  {},
  SettingsCollectionMethods
>

export const settingsSchema: RxJsonSchema<
  SettingsDocType & {
    // @deprecated
    contentPassword?: string | null
  }
> = {
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: "string", final: true, maxLength: 100 },
    contentPassword: { type: ["string", "null"] },
    masterEncryptionKey: {
      type: ["object", "null"],
      properties: {
        salt: { type: "string" },
        iv: { type: "string" },
        data: { type: "string" },
      },
      required: ["salt", "iv", "data"],
    },
    ...getReplicationProperties(`settings`),
  },
}

export const settingsSchemaMigrationStrategies: MigrationStrategies = {}

export const initializeSettings = async (db: Database) => {
  const settings = await db.settings.findOne().exec()

  if (!settings) {
    await db.settings.insert({
      _id: "settings",
    })
  }
}
