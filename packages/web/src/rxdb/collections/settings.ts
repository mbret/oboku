import { RxCollection, RxDocument, RxJsonSchema, RxQuery } from "rxdb"
import { SafeUpdateMongoUpdateSyntax } from "../types"
import { SettingsDocType } from "../databases"
import { getReplicationProperties } from "../rxdb-plugins/replication"

export type SettingsDocument = RxDocument<SettingsDocType>

type SettingsCollectionMethods = {
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<SettingsDocType>,
    cb: (collection: SettingsCollection) => RxQuery
  ) => Promise<SettingsDocument>
}

export type SettingsCollection = RxCollection<
  SettingsDocType,
  {},
  SettingsCollectionMethods
>

export const settingsCollectionMethods: SettingsCollectionMethods = {
  safeUpdate: async function (this: SettingsCollection, json, cb) {
    return cb(this).update(json)
  }
}

export const settingsMigrationStrategies = {}

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
