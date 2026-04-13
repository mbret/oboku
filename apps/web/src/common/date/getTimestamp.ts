export const getTimestamp = (value: Date | number | string) =>
  value instanceof Date ? value.getTime() : new Date(value).getTime()
