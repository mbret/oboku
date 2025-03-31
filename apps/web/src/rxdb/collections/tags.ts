import type { TagsDocType } from "@oboku/shared"
import type {
  MigrationStrategies,
  RxCollection,
  RxDocument,
  RxJsonSchema,
} from "rxdb"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import { generateId } from "./utils"

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type DocMethods = {}

type CollectionMethods = {
  insertSafe: (
    json: Omit<TagsDocType, `_id` | "rx_model" | "_rev" | `rxdbMeta`>,
  ) => Promise<TagsDocument>
}

type TagsDocument = RxDocument<TagsDocType, DocMethods>

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
    _id: { type: `string`, maxLength: 100 },
    name: { type: ["string"], final: false },
    isProtected: { type: ["boolean"], final: false },
    isBlurEnabled: { type: ["boolean"] },
    books: { type: ["array"], items: { type: "string" } },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    ...getReplicationProperties(`tag`),
  },
  required: ["isProtected", "name", "books"],
}

const docMethods: DocMethods = {}

const collectionMethods: CollectionMethods = {
  insertSafe: async function (this: TagCollection, json) {
    return this.insert({ _id: generateId(), ...json } as TagsDocType)
  },
}

const migrationStrategies: MigrationStrategies = {}

export const tag = {
  schema: schema,
  methods: docMethods,
  statics: collectionMethods,
  migrationStrategies: migrationStrategies,
}
