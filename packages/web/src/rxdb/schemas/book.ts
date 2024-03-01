import {
  BookDocType,
  DeprecatedBookDocType,
  InsertAbleBookDocType
} from "@oboku/shared"
import { RxCollection, RxDocument, RxJsonSchema, RxQuery } from "rxdb"
import { MongoUpdateSyntax } from "../../types"
import { getReplicationProperties } from "../rxdb-plugins/replication"
import { SafeMangoQuery, SafeUpdateMongoUpdateSyntax } from "../types"
import { generateId } from "./utils"

type BookDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<BookDocType>) => Promise<any>
}

export type BookDocument = RxDocument<BookDocType, BookDocMethods>

type BookCollectionMethods = {
  post: (
    json: Omit<InsertAbleBookDocType, "rx_model" | `rxdbMeta`>
  ) => Promise<BookDocument>
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<BookDocType>,
    getter: (collection: BookCollection) => RxQuery
  ) => Promise<BookDocument>
  safeFind: (
    updateObj: SafeMangoQuery<BookDocType>
  ) => RxQuery<BookDocType, RxDocument<BookDocType, BookDocMethods>[]>
  safeFindOne: (
    updateObj: SafeMangoQuery<BookDocType>
  ) => RxQuery<BookDocType, RxDocument<BookDocType, BookDocMethods> | null>
}

export type BookCollection = RxCollection<
  BookDocType,
  BookDocMethods,
  BookCollectionMethods
>

export const bookDocMethods: BookDocMethods = {
  safeUpdate: function (this: BookDocument, updateObj) {
    return this.update(updateObj)
  }
}

export const bookCollectionMethods: BookCollectionMethods = {
  post: async function (this: BookCollection, json) {
    return this.insert({ _id: generateId(), ...json } as BookDocType)
  },
  safeUpdate: async function (this: BookCollection, json, getter) {
    return getter(this).update(json)
  },
  safeFind: function (this: BookCollection, json) {
    return this.find(json)
  },
  safeFindOne: function (this: BookCollection, json) {
    return this.findOne(json)
  }
}

export const bookSchemaMigrationStrategies = {}

export const bookSchema: RxJsonSchema<
  Omit<BookDocType & DeprecatedBookDocType, `_rev` | `rxdbMeta`>
> = {
  title: "books",
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 50 },
    collections: {
      type: "array",
      ref: "obokucollection",
      items: { type: "string" }
    },
    createdAt: { type: ["number"] },
    creator: { type: ["string", "null"] },
    date: { type: ["number", "null"] },
    lang: { type: ["string", "null"] },
    lastMetadataUpdatedAt: { type: ["number", "null"] },
    lastMetadataUpdateError: { type: ["string", "null"] },
    metadataUpdateStatus: { type: ["string", "null"] },
    links: { ref: "link", type: "array", items: { type: "string" } },
    publisher: { type: ["string", "null"] },
    readingStateCurrentBookmarkLocation: { type: ["string", "null"] },
    readingStateCurrentBookmarkProgressPercent: { type: ["number"] },
    readingStateCurrentBookmarkProgressUpdatedAt: {
      type: ["string", "null"]
    },
    readingStateCurrentState: { type: ["string"] },
    rights: { type: ["string", "null"] },
    subject: { type: ["array", "null"], items: { type: "string" } },
    tags: { type: "array", ref: "tag", items: { type: "string" } },
    title: { type: ["string", "null"] },
    modifiedAt: { type: ["string", "null"] },
    isAttachedToDataSource: { type: ["boolean"] },
    isNotInterested: { type: ["boolean"] },
    metadata: { type: ["array"] },
    ...getReplicationProperties(`book`)
  },
  required: []
}
