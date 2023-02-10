import { LinkDocType, SafeMangoQuery } from "@oboku/shared"
import { RxCollection, RxDocument, RxJsonSchema, RxQuery } from "rxdb"
import { MongoUpdateSyntax } from "../../types"
import { getReplicationProperties } from "../rxdb-plugins/replication"
import { SafeUpdateMongoUpdateSyntax } from "../types"
import { TagsDocument } from "./tags"
import { generateId } from "./utils"

export type LinkCollection = RxCollection<
  LinkDocType,
  LinkDocMethods,
  LinkCollectionMethods
>

type LinkDocMethods = {
  safeUpdate: (updateObj: MongoUpdateSyntax<LinkDocType>) => Promise<any>
}
type LinkDocument = RxDocument<LinkDocType, LinkDocMethods>
type LinkCollectionMethods = {
  safeInsert: (
    json: Omit<LinkDocType, "_id" | "rx_model" | "_rev" | `rxdbMeta`>
  ) => Promise<LinkDocument>
  safeUpdate: (
    json: SafeUpdateMongoUpdateSyntax<LinkDocType>,
    cb: (collection: LinkCollection) => RxQuery
  ) => Promise<TagsDocument>
  safeFind: (
    updateObj: SafeMangoQuery<LinkDocType>
  ) => RxQuery<LinkDocType, RxDocument<LinkDocType, LinkDocMethods>[]>
  safeFindOne: (
    updateObj: SafeMangoQuery<LinkDocType>
  ) => RxQuery<LinkDocType, RxDocument<LinkDocType, LinkDocMethods> | null>
}

const linkSchema: RxJsonSchema<Omit<LinkDocType, `_rev` | `rxdbMeta`>> = {
  title: "link",
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 50 },
    data: { type: ["string", "null"] },
    resourceId: { type: "string" },
    type: { type: "string" },
    book: { type: ["string", "null"] },
    contentLength: { type: ["number", "null"] },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    ...getReplicationProperties(`link`)
  },
  required: ["data", "resourceId", "type"]
}

const linkSchemaMigrationStrategies = {}

const linkDocMethods: LinkDocMethods = {
  safeUpdate: async function (this: LinkDocument, updateObj) {
    return this.update(updateObj)
  }
}

const linkCollectionMethods: LinkCollectionMethods = {
  safeInsert: async function (this: LinkCollection, json) {
    return this.insert({ _id: generateId(), ...json } as LinkDocType)
  },
  safeUpdate: async function (this: LinkCollection, json, cb) {
    return cb(this).update(json)
  },
  safeFind: function (this: LinkCollection, json) {
    return this.find(json)
  },
  safeFindOne: function (this: LinkCollection, json) {
    return this.findOne(json)
  }
}

export const link = {
  schema: linkSchema,
  statics: linkCollectionMethods,
  methods: linkDocMethods,
  migrationStrategies: linkSchemaMigrationStrategies
}
