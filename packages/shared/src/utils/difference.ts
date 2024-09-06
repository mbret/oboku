type List<T> = ArrayLike<T>

export function difference<T>(
  array: List<T> | null | undefined,
  ...values: Array<List<T>>
): T[] {
  // If the first array is undefined or null, return an empty array
  if (!array) {
    return []
  }

  // Flatten all the subsequent arrays into a single Set for fast lookup
  const valuesSet = values.flat()

  // Filter the first array, keeping only the elements not in any of the subsequent arrays
  const finalArray = []

  for (let i = 0; i < array.length; i++) {
    // @ts-ignore
    if (!valuesSet.includes(array[i])) {
      finalArray.push(array[i])
    }
  }

  return finalArray
}
