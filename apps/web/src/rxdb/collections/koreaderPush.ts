import type { RxCollection, RxCollectionCreator, RxJsonSchema } from "rxdb"

/**
 * The latest bookmark move made by reading on this device that still waits to
 * be pushed to the KOReader sync server under the KOReader document `_id`,
 * with the book it was made in and the profile it was made under. One per
 * document, as the server keeps one position per document. Never replicated.
 */
export type KoreaderPushDocType = {
  _id: string
  bookId: string
  profileId: string
  movedAt: string
}

export type KoreaderPushCollection = RxCollection<KoreaderPushDocType>

const schema: RxJsonSchema<KoreaderPushDocType> = {
  title: "koreaderpush",
  version: 0,
  type: "object",
  primaryKey: "_id",
  properties: {
    _id: { type: "string", maxLength: 100 },
    bookId: { type: "string" },
    profileId: { type: "string" },
    movedAt: { type: "string" },
  },
  required: ["_id", "bookId", "profileId", "movedAt"],
}

export const koreaderPushCollection: RxCollectionCreator<KoreaderPushDocType> =
  {
    schema,
  }
