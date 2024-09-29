type ValueIteratee<T> = ((value: T) => string | number) | keyof T

interface Dictionary<T> {
  [index: string]: T
}

export function groupBy<T>(
  collection: Array<T> | null | undefined,
  iteratee: ValueIteratee<T> = (value) => String(value)
): Dictionary<T[]> {
  const result: Dictionary<T[]> = {}

  if (!collection) {
    return result // Return an empty object if the collection is null or undefined
  }

  // Determine the iteratee function or property accessor
  const getKey =
    typeof iteratee === "function"
      ? iteratee
      : (item: T) => String(item[iteratee])

  for (const item of collection) {
    const key = getKey(item) // Generate the key using the iteratee or property name
    if (result[key]) {
      // @ts-ignore
      result[key].push(item) // Add item to the existing key array
    } else {
      // @ts-ignore
      result[key] = [item] // Initialize the key with a new array containing the item
    }
  }

  return result
}
