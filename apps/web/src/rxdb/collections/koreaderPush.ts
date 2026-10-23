import type { RxCollection, RxCollectionCreator, RxJsonSchema } from "rxdb"

/**
 * A book's bookmark move made by reading on this device that still waits to
 * be pushed to the KOReader sync server, with the profile it was made under.
 * Never replicated.
 */
export type KoreaderPushDocType = {
  _id: string
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
    profileId: { type: "string" },
    movedAt: { type: "string" },
  },
  required: ["_id", "profileId", "movedAt"],
}

export const koreaderPushCollection: RxCollectionCreator<KoreaderPushDocType> =
  {
    schema,
  }
