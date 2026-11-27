export const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0)
