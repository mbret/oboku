import { RxCollection, RxDocument, RxJsonSchema, RxQuery } from "rxdb"
import { getReplicationProperties } from "../rxdb-plugins/replication"
import { SafeMangoQuery, SafeUpdateMongoUpdateSyntax } from "../types"
import { CollectionDocType } from "@oboku/shared"
import { generateId } from "./utils"

export type CollectionDocMethods = {}

export type CollectionDocument = RxDocument<
  CollectionDocType,
  CollectionDocMethods
>

type CollectionCollectionMethods = {
  post: (
    json: Omit<CollectionDocType, "_id" | "rx_model" | "_rev" | `rxdbMeta`>
  ) => Promise<CollectionDocument>
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<CollectionDocType>,
    cb: (collection: CollectionCollection) => RxQuery
  ) => Promise<CollectionDocument>
  safeFind: (
    updateObj: SafeMangoQuery<CollectionDocType>
  ) => RxQuery<
    CollectionDocType,
    RxDocument<CollectionDocType, CollectionDocMethods>[]
  >
}

export type CollectionCollection = RxCollection<
  CollectionDocType,
  {},
  CollectionCollectionMethods
>

export const collectionSchema: RxJsonSchema<
  Omit<CollectionDocType, `_rev` | `rxdbMeta`>
> = {
  title: "obokucollection",
  version: 3,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 50 },
    name: { type: "string" },
    books: { type: "array", ref: "book", items: { type: "string" } },
    resourceId: { type: ["string", "null"] },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    dataSourceId: { type: ["string", "null"] },
    ...getReplicationProperties(`obokucollection`)
  },
  required: ["name"]
}

export const collectionMigrationStrategies = {
  1: (
    oldDoc: Omit<CollectionDocType, `createdAt` | `modifiedAt`>
  ): CollectionDocType | null => {
    return {
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      ...oldDoc
    }
  },
  2: (
    oldDoc: Omit<CollectionDocType, `dataSourceId`>
  ): CollectionDocType | null => {
    return {
      dataSourceId: null,
      ...oldDoc
    }
  },
  // v10 -> v12
  3: (doc: CollectionDocType) => doc
}

export const collectionCollectionMethods: CollectionCollectionMethods = {
  post: async function (this: CollectionCollection, json) {
    return this.insert({ _id: generateId(), ...json } as CollectionDocType)
  },
  safeUpdate: async function (this: CollectionCollection, json, cb) {
    return cb(this).update(json)
  },
  safeFind: function (this: CollectionCollection, json) {
    return this.find(json)
  }
}
