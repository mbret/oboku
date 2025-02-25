export default {
  type: "object",
  properties: {
    collectionId: { type: "string" },
    credentials: { type: `string` },
    authorization: { type: `string` },
    soft: { type: "boolean" },
  },
  required: ["collectionId"],
} as const
