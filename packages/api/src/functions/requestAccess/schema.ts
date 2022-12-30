export default {
  type: "object",
  properties: {
    email: { type: 'string' },
  },
  required: ['email']
} as const;
