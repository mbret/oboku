export function intersection<T>(
  ...arrays: Array<ArrayLike<T> | null | undefined>
): T[] {
  // Filter out undefined or null arrays
  const filteredArrays = arrays.filter((arr) => arr != null) as Array<Array<T>>

  // If there are no valid arrays, return an empty array
  if (filteredArrays.length === 0) {
    return []
  }

  // Start with the first array's unique values
  const [firstArray, ...restArrays] = filteredArrays
  const uniqueValues = new Set(firstArray)

  // Iterate through each element of the first array
  return Array.from(uniqueValues).filter((item) =>
    // Check if the item is included in all other arrays
    restArrays.every((arr) => arr.includes(item))
  )
}
