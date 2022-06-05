import {
  RxDocument,
  RxJsonSchema,
  RxQuery,
  RxCollection,
  getDefaultRxDocumentMeta,
  MigrationStrategies
} from "rxdb"
import { DataSourceDocType } from "@oboku/shared"
import { SafeUpdateMongoUpdateSyntax } from "../types"
import { getReplicationProperties } from "../rxdb-plugins/replication"
import { generateId } from "./utils"
import { migrateDocumentData } from "rxdb/plugins/migration"

export type DataSourceDocMethods = {}

export type DataSourceDocument = RxDocument<
  DataSourceDocType,
  DataSourceDocMethods
>

type DataSourceCollectionMethods = {
  post: (
    json: Omit<DataSourceDocType, "_id" | "rx_model" | "_rev">
  ) => Promise<DataSourceDocument>
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<DataSourceDocType>,
    cb: (dataSource: DataSourceCollection) => RxQuery
  ) => Promise<DataSourceDocument>
}

export type DataSourceCollection = RxCollection<
  DataSourceDocType,
  {},
  DataSourceCollectionMethods
>

export const dataSourceSchema: RxJsonSchema<
  Omit<DataSourceDocType, "rx_model" | "_rev">
> = {
  title: "dataSourceSchema",
  version: 3,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 50 },
    type: { type: "string", final: true },
    lastSyncedAt: { type: ["number", "null"] },
    syncStatus: { type: ["string", "null"] },
    lastSyncErrorCode: { type: ["string", "null"] },
    data: { type: "string" },
    credentials: { type: ["object", "null"] },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    ...getReplicationProperties(`datasource`)
  },
  required: []
}

export const migrationStrategies: MigrationStrategies = {
  1: (
    oldDoc: Omit<DataSourceDocType, `createdAt` | `modifiedAt`>
  ): DataSourceDocType | null => {
    return {
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      ...oldDoc
    }
  },
  2: (
    oldDoc: Omit<DataSourceDocType, `syncStatus`>
  ): DataSourceDocType | null => {
    return {
      syncStatus: null,
      ...oldDoc
    }
  },
  // v10 -> v12
  3: (doc) => doc
}

export const dataSourceCollectionMethods: DataSourceCollectionMethods = {
  post: async function (this: DataSourceCollection, json) {
    return this.insert({ _id: generateId(), ...json } as DataSourceDocType)
  },
  safeUpdate: async function (this: DataSourceCollection, json, cb) {
    return cb(this).update(json)
  }
}
