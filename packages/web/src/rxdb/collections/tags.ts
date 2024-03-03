import { TagsDocType } from "@oboku/shared"
import {
  MigrationStrategies,
  RxCollection,
  RxDocument,
  RxJsonSchema,
  RxQuery
} from "rxdb"
import { MongoUpdateSyntax } from "../../types"
import { getReplicationProperties } from "../rxdb-plugins/replication"
import { SafeMangoQuery, SafeUpdateMongoUpdateSyntax } from "../types"
import { generateId } from "./utils"

type DocMethods = {
  updateSafe: (updateObj: MongoUpdateSyntax<TagsDocType>) => Promise<any>
}

type CollectionMethods = {
  insertSafe: (
    json: Omit<TagsDocType, `_id` | "rx_model" | "_rev" | `rxdbMeta`>
  ) => Promise<TagsDocument>
  safeFind: (
    updateObj: SafeMangoQuery<TagsDocType>
  ) => RxQuery<TagsDocType, RxDocument<TagsDocType, DocMethods>[]>
  updateSafe: (
    json: SafeUpdateMongoUpdateSyntax<TagsDocType>,
    cb: (collection: TagCollection) => RxQuery
  ) => Promise<TagsDocument>
}

export type TagsDocument = RxDocument<TagsDocType, DocMethods>

export type TagCollection = RxCollection<
  TagsDocType,
  DocMethods,
  CollectionMethods
>

const schema: RxJsonSchema<Omit<TagsDocType, `_rev` | `rxdbMeta`>> = {
  title: "tag",
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 50 },
    name: { type: ["string"], final: false },
    isProtected: { type: ["boolean"], final: false },
    isBlurEnabled: { type: ["boolean"] },
    books: { type: ["array"], items: { type: "string" } },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    ...getReplicationProperties(`tag`)
  },
  required: ["isProtected", "name", "books"]
}

const docMethods: DocMethods = {
  updateSafe: function (this: TagsDocument, updateObj) {
    return this.update(updateObj)
  }
}

const collectionMethods: CollectionMethods = {
  insertSafe: async function (this: TagCollection, json) {
    return this.insert({ _id: generateId(), ...json } as TagsDocType)
  },
  safeFind: function (this: TagCollection, json) {
    return this.find(json)
  },
  updateSafe: async function (this: TagCollection, json, cb) {
    return cb(this).update(json)
  }
}

const migrationStrategies: MigrationStrategies = {}

export const tag = {
  schema: schema,
  methods: docMethods,
  statics: collectionMethods,
  migrationStrategies: migrationStrategies
}
