import type {
  RxDocument,
  RxJsonSchema,
  RxCollection,
  MigrationStrategies,
} from "rxdb"
import type { LibrarySyncDocType } from "@oboku/shared"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import { generateId } from "./utils"

type DataSourceDocument = RxDocument<LibrarySyncDocType>

type DataSourceCollectionMethods = {
  post: (
    json: Omit<LibrarySyncDocType, "_id" | "rx_model" | "_rev" | `rxdbMeta`>,
  ) => Promise<DataSourceDocument>
}

export type DataSourceCollection = RxCollection<
  LibrarySyncDocType,
  object,
  DataSourceCollectionMethods
>

export const dataSourceSchema: RxJsonSchema<
  Omit<LibrarySyncDocType, "rx_model" | "_rev" | `rxdbMeta`> & {
    data?: string
  }
> = {
  title: "dataSourceSchema",
  version: 1,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 100 },
    type: { type: "string", final: true },
    lastSyncedAt: { type: ["number", "null"] },
    syncStatus: { type: ["string", "null"] },
    lastSyncErrorCode: { type: ["string", "null"] },
    data: { type: "string" },
    data_v2: { type: "object" },
    credentials: { type: ["object", "null"] },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    isProtected: { type: ["boolean"], final: false },
    name: { type: ["string", "null"] },
    tags: { type: ["array", "null"] },
    metadataFileDownloadEnabled: { type: ["boolean", "null"] },
    ...getReplicationProperties(`datasource`),
  },
  required: [],
}

export const migrationStrategies: MigrationStrategies = {
  1: (oldDoc: Record<string, unknown>) => oldDoc,
}

export const dataSourceCollectionMethods: DataSourceCollectionMethods = {
  post: async function (this: DataSourceCollection, json) {
    return this.insert({ _id: generateId(), ...json } as LibrarySyncDocType)
  },
}
