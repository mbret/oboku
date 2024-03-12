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

type DeprecatedProps = {
  name?: string
  resourceId?: string
  dataSourceId?: string
}

export const collectionSchema: RxJsonSchema<
  Omit<CollectionDocType & DeprecatedProps, `_rev` | `rxdbMeta`>
> = {
  title: "obokucollection",
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 100 },
    books: { type: "array", ref: "book", items: { type: "string" } },
    resourceId: { type: ["string", "null"] },
    name: { type: ["string", "null"] },
    type: { type: ["string", "null"] },
    linkType: { type: "string" },
    linkResourceId: { type: "string" },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    lastMetadataUpdatedAt: { type: ["string"] },
    syncAt: { type: ["string"] },
    dataSourceId: { type: ["string", "null"] },
    metadata: { type: ["array"] },
    ...getReplicationProperties(`obokucollection`)
  }
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
