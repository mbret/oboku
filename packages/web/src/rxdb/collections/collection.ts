import type { RxCollection, RxDocument, RxJsonSchema } from "rxdb"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import type { CollectionDocType } from "@oboku/shared"
import { generateId } from "./utils"

type CollectionDocMethods = {}

type CollectionDocument = RxDocument<CollectionDocType, CollectionDocMethods>

type CollectionCollectionMethods = {
  post: (
    json: Omit<CollectionDocType, "_id" | "rx_model" | "_rev" | `rxdbMeta`>,
  ) => Promise<CollectionDocument>
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
    lastMetadataStartedAt: { type: ["string"] },
    lastMetadataUpdateError: { type: ["string", "null"] },
    metadataUpdateStatus: { type: ["string"] },
    syncAt: { type: ["string"] },
    dataSourceId: { type: ["string", "null"] },
    metadata: { type: ["array"] },
    ...getReplicationProperties(`obokucollection`),
  },
}

export const collectionMigrationStrategies = {}

export const collectionCollectionMethods: CollectionCollectionMethods = {
  post: async function (this: CollectionCollection, json) {
    return this.insert({ _id: generateId(), ...json } as CollectionDocType)
  },
}
