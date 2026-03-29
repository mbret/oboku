import type { LinkDocType } from "@oboku/shared"
import type { RxCollection, RxDocument, RxJsonSchema } from "rxdb"
import { getReplicationProperties } from "../replication/getReplicationProperties"
import { generateId, migrateResourceIdToData } from "./utils"

export type LinkCollection = RxCollection<
  LinkDocType,
  LinkDocMethods,
  LinkCollectionMethods
>

// biome-ignore lint/complexity/noBannedTypes: TODO
type LinkDocMethods = {}

type LinkDocument = RxDocument<LinkDocType, LinkDocMethods>

type LinkCollectionMethods = {
  safeInsert: (
    json: Omit<LinkDocType, "_id" | "rx_model" | "_rev" | `rxdbMeta`>,
  ) => Promise<LinkDocument>
}

const linkSchema: RxJsonSchema<
  Omit<
    LinkDocType & {
      dataSourceId?: string
    },
    `_rev` | `rxdbMeta`
  >
> = {
  title: "link",
  version: 1,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 100 },
    data: { type: "object" },
    dataSourceId: { type: "string" },
    type: { type: "string" },
    book: { type: ["string", "null"] },
    contentLength: { type: ["number", "null"] },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    ...getReplicationProperties(`link`),
  },
  required: ["data", "type"],
}

const linkSchemaMigrationStrategies = {
  1: (oldDoc: Record<string, unknown>) => {
    const type = (oldDoc.type ?? "") as string
    const resourceId = oldDoc.resourceId as string | undefined
    const existingData = oldDoc.data as Record<string, unknown> | null

    const newData = migrateResourceIdToData(type, resourceId, existingData)

    const { resourceId: _, ...rest } = oldDoc

    return { ...rest, data: newData }
  },
}

const linkDocMethods: LinkDocMethods = {}

const linkCollectionMethods: LinkCollectionMethods = {
  safeInsert: async function (this: LinkCollection, json) {
    return this.insert({ _id: generateId(), ...json } as LinkDocType)
  },
}

export const link = {
  schema: linkSchema,
  statics: linkCollectionMethods,
  methods: linkDocMethods,
  migrationStrategies: linkSchemaMigrationStrategies,
}
