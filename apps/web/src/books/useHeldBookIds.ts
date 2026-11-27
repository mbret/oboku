import type { DeepReadonlyArray } from "rxdb"
import { useBookIds } from "./states"

const selectBookIdSet = (bookIds: string[]) => new Set(bookIds)

/**
 * The ids in `ids` of the books this device holds, in the order of `ids`.
 * `ids` can hold ids of deleted books, or of books the device has not received
 * yet. Protected and not interested books stay in the result.
 */
export const useHeldBookIds = (ids: DeepReadonlyArray<string> | undefined) => {
  const { data: heldBookIdSet } = useBookIds({ select: selectBookIdSet })

  if (ids === undefined || heldBookIdSet === undefined) return undefined

  return ids.filter((id) => heldBookIdSet.has(id))
}
