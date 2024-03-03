import {
  AtomicUpdateFunction,
  RxCollection,
  RxDocument,
  RxJsonSchema,
  RxQuery
} from "rxdb"
import { getReplicationProperties } from "../rxdb-plugins/replication"
import { SafeMangoQuery, SafeUpdateMongoUpdateSyntax } from "../types"
import { CollectionDocType } from "@oboku/shared"
import { generateId } from "./utils"

export type CollectionDocMethods = {
  incrementalModify: (
    mutationFunction: AtomicUpdateFunction<CollectionDocType>,
    context?: string | undefined
  ) => Promise<RxDocument<CollectionDocType, CollectionDocMethods>>
}

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
  CollectionDocMethods,
  CollectionCollectionMethods
>

export const collectionSchema: RxJsonSchema<
  Omit<CollectionDocType, `_rev` | `rxdbMeta`>
> = {
  title: "obokucollection",
  version: 0,
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

export const collectionMigrationStrategies = {}

export const collectionDocMethods: CollectionDocMethods = {
  incrementalModify: function (this: CollectionDocument, mutationFunction) {
    return this.atomicUpdate(mutationFunction)
  }
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
