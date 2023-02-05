export default {
  type: "object",
  properties: {
    dataSourceId: { type: "string" },
    credentials: { type: `string` },
    authorization: { type: `string` }
  },
  required: []
} as const
