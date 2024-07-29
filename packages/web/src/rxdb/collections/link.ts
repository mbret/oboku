import { LinkDocType } from "@oboku/shared"
import { RxCollection, RxDocument, RxJsonSchema } from "rxdb"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import { generateId } from "./utils"
import { conflictHandler } from "../replication/conflictHandler"

export type LinkCollection = RxCollection<
  LinkDocType,
  LinkDocMethods,
  LinkCollectionMethods
>

type LinkDocMethods = {}

type LinkDocument = RxDocument<LinkDocType, LinkDocMethods>

type LinkCollectionMethods = {
  safeInsert: (
    json: Omit<LinkDocType, "_id" | "rx_model" | "_rev" | `rxdbMeta`>
  ) => Promise<LinkDocument>
}

const linkSchema: RxJsonSchema<Omit<LinkDocType, `_rev` | `rxdbMeta`>> = {
  title: "link",
  version: 0,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 100 },
    data: { type: ["string", "object", "null"] },
    resourceId: { type: "string" },
    dataSourceId: { type: "string" },
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

const linkDocMethods: LinkDocMethods = {}

const linkCollectionMethods: LinkCollectionMethods = {
  safeInsert: async function (this: LinkCollection, json) {
    return this.insert({ _id: generateId(), ...json } as LinkDocType)
  }
}

export const link = {
  schema: linkSchema,
  statics: linkCollectionMethods,
  methods: linkDocMethods,
  migrationStrategies: linkSchemaMigrationStrategies,
  conflictHandler
}
