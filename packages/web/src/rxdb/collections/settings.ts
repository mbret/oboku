import { RxCollection, RxDocument, RxJsonSchema } from "rxdb"
import { Database } from "../databases"
import { getReplicationProperties } from "../replication/getReplicationProperties"

export type SettingsDocument = RxDocument<SettingsDocType>

type SettingsCollectionMethods = {}

export type SettingsDocType = {
  _id: "settings"
  contentPassword: string | null
}

export type SettingsCollection = RxCollection<
  SettingsDocType,
  {},
  SettingsCollectionMethods
>

export const settingsSchema: RxJsonSchema<SettingsDocType> = {
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: "string", final: true, maxLength: 100 },
    contentPassword: { type: ["string", "null"] },
    ...getReplicationProperties(`settings`)
  }
}

export const initializeSettings = async (db: Database) => {
  const settings = await db.settings.findOne().exec()

  if (!settings) {
    await db.settings.insert({
      contentPassword: null,
      _id: "settings"
    })
  }
}
