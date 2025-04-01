export function intersection<T>(
  ...arrays: Array<ArrayLike<T> | null | undefined>
): T[] {
  // Filter out undefined or null arrays
  const filteredArrays = arrays.filter((arr) => arr != null) as Array<Array<T>>

  // If there are no valid arrays, return an empty array
  if (filteredArrays.length === 0) {
    return []
  }

  const [first, ...rest] = filteredArrays
  const seen = new Set<T>()
  const result: T[] = []

  // Iterate through the first array maintaining order
  for (let i = 0; i < (first?.length ?? 0); i++) {
    const value = first?.[i]
    
    // Skip if we've already processed this value
    if (seen.has(value as T)) continue

    // Check if value exists in all other arrays
    let isCommon = true
    for (let j = 0; j < rest.length; j++) {
      if (!rest[j]?.includes(value as T)) {
        isCommon = false
        break
      }
    }

    if (isCommon) {
      seen.add(value as T)
      result.push(value as T)
    }
  }

  return result
}