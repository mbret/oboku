export default {
  type: "object",
  properties: {
    email: { type: "string" },
    password: { type: "string" },
    code: { type: "string" }
  },
  required: ["email", `password`]
} as const
