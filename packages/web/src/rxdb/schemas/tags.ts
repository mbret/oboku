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
import { SafeUpdateMongoUpdateSyntax } from "../types"
import { generateId } from "./utils"

type DocMethods = {
  updateSafe: (updateObj: MongoUpdateSyntax<TagsDocType>) => Promise<any>
}

type CollectionMethods = {
  insertSafe: (
    json: Omit<TagsDocType, `_id` | "rx_model" | "_rev">
  ) => Promise<TagsDocument>
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

const schema: RxJsonSchema<Omit<TagsDocType, `_rev`>> = {
  title: "tag",
  version: 3,
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
    // @ts-ignore
    _meta: { type: `object` },
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
  updateSafe: async function (this: TagCollection, json, cb) {
    return cb(this).update(json)
  }
}

const migrationStrategies: MigrationStrategies = {
  1: (
    oldDoc: Omit<TagsDocType, `createdAt` | `modifiedAt`>
  ): TagsDocType | null => ({
    createdAt: new Date().toISOString(),
    modifiedAt: null,
    ...oldDoc
  }),
  2: (oldDoc: TagsDocType): TagsDocType | null => oldDoc,
  // v10 -> v12
  3: (doc: TagsDocType) => doc
}

export const tag = {
  schema: schema,
  methods: docMethods,
  statics: collectionMethods,
  migrationStrategies: migrationStrategies
}
