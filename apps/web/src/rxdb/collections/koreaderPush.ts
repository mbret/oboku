import type { RxCollection, RxCollectionCreator, RxJsonSchema } from "rxdb"

/**
 * The KOReader push of a book's bookmark on this device: the last move reading
 * made here (`movedAt`), and the last move the push dealt with
 * (`handledMovedAt`). The move waits to be pushed while the two differ. Never
 * replicated.
 */
export type KoreaderPushDocType = {
  _id: string
  movedAt: string
  handledMovedAt?: string
}

export type KoreaderPushCollection = RxCollection<KoreaderPushDocType>

const schema: RxJsonSchema<KoreaderPushDocType> = {
  title: "koreaderpush",
  version: 0,
  type: "object",
  primaryKey: "_id",
  properties: {
    _id: { type: "string", maxLength: 100 },
    movedAt: { type: "string" },
    handledMovedAt: { type: "string" },
  },
  required: ["_id", "movedAt"],
}

export const koreaderPushCollection: RxCollectionCreator<KoreaderPushDocType> =
  {
    schema,
  }
