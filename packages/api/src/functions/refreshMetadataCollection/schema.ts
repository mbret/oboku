export default {
  type: "object",
  properties: {
    collectionId: { type: "string" },
    soft: { type: "boolean" }
  },
  required: ["collectionId"]
} as const
