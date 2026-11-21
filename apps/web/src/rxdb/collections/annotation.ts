import type { AnnotationDocType } from "@oboku/shared"
import type {
  MigrationStrategies,
  RxCollection,
  RxCollectionCreator,
  RxJsonSchema,
} from "rxdb"
import { getReplicationProperties } from "../replication/getReplicationProperties"

export type RxdbAnnotationDocType = Omit<AnnotationDocType, `_rev` | `rxdbMeta`>

export type AnnotationCollection = RxCollection<RxdbAnnotationDocType>

const schema: RxJsonSchema<RxdbAnnotationDocType> = {
  title: "annotation",
  version: 1,
  type: "object",
  primaryKey: `_id`,
  properties: {
    _id: { type: `string`, maxLength: 100 },
    bookId: { type: "string", maxLength: 100 },
    cfi: { type: "string" },
    highlightColor: { type: ["string", "null"] },
    notes: { type: ["string", "null"] },
    highlightedText: { type: ["string", "null"] },
    createdAt: { type: "string" },
    modifiedAt: { type: ["string", "null"] },
    ...getReplicationProperties(`annotation`),
  },
  required: ["bookId", "cfi", "createdAt"],
  indexes: ["bookId"],
}

const migrationStrategies: MigrationStrategies = {
  1: (oldDoc: Record<string, unknown>) => oldDoc,
}

export const annotationCollection: RxCollectionCreator<RxdbAnnotationDocType> =
  {
    schema,
    migrationStrategies,
  }
