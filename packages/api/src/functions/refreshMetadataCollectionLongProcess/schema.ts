export default {
  type: "object",
  properties: {
    collectionId: { type: "string" },
    credentials: { type: `string` },
    authorization: { type: `string` }
  },
  required: ["collectionId"]
} as const
