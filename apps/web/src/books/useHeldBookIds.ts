import { keepPreviousData } from "@tanstack/react-query"
import type { DeepReadonlyArray } from "rxdb"
import { useBooks } from "./states"

/**
 * The ids among `ids` of the books this device holds, in the order of `ids`.
 * An id of a deleted book, or of a book the device has not received yet, is
 * left out. Protected and not interested books count. The data is `undefined`
 * until `ids` is known, and keeps its last value while `ids` changes.
 */
export const useExistingBookIds = (
  ids: DeepReadonlyArray<string> | undefined,
) =>
  useBooks({
    ids,
    includeProtected: true,
    enabled: ids !== undefined,
    placeholderData: keepPreviousData,
    select: function selectExistingBookIds(books) {
      const heldBookIds = new Set(books.map((book) => book._id))

      return ids?.filter((id) => heldBookIds.has(id)) ?? []
    },
  })
