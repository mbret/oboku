import {
  RxDocument,
  RxJsonSchema,
  RxCollection,
  MigrationStrategies
} from "rxdb"
import { DataSourceDocType } from "@oboku/shared"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import { generateId } from "./utils"

export type DataSourceDocMethods = {}

export type DataSourceDocument = RxDocument<
  DataSourceDocType,
  DataSourceDocMethods
>

type DataSourceCollectionMethods = {
  post: (
    json: Omit<DataSourceDocType, "_id" | "rx_model" | "_rev" | `rxdbMeta`>
  ) => Promise<DataSourceDocument>
}

export type DataSourceCollection = RxCollection<
  DataSourceDocType,
  DataSourceDocMethods,
  DataSourceCollectionMethods
>

export const collectionDocMethods: DataSourceDocMethods = {}

export const dataSourceSchema: RxJsonSchema<
  Omit<DataSourceDocType, "rx_model" | "_rev" | `rxdbMeta`>
> = {
  title: "dataSourceSchema",
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 100 },
    type: { type: "string", final: true },
    lastSyncedAt: { type: ["number", "null"] },
    syncStatus: { type: ["string", "null"] },
    lastSyncErrorCode: { type: ["string", "null"] },
    data: { type: "string" },
    credentials: { type: ["object", "null"] },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    isProtected: { type: ["boolean"], final: false },
    ...getReplicationProperties(`datasource`)
  },
  required: []
}

export const migrationStrategies: MigrationStrategies = {}

export const dataSourceCollectionMethods: DataSourceCollectionMethods = {
  post: async function (this: DataSourceCollection, json) {
    return this.insert({ _id: generateId(), ...json } as DataSourceDocType)
  }
}
