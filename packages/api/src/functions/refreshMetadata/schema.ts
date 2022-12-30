export default {
  type: "object",
  properties: {
    bookId: { type: 'string' },
  },
  required: ['bookId']
} as const;
