import { BookDocType, SafeMangoQuery } from "@oboku/shared"
import { useBooks } from "./states"
import { useProtectedTagIds } from "../tags/helpers"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../library/states"
import { useMemo } from "react"
import { intersection } from "lodash"

export const useVisibleBooks = ({
  queryObj
}: { queryObj?: SafeMangoQuery<BookDocType> } = {}) => {
  const { data: books, isLoading: isBooksLoading } = useBooks({ queryObj })
  const { data: protectedTagIds, isLoading: isTagsLoading } =
    useProtectedTagIds()
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)

  const data = useMemo(() => {
    if (isLibraryUnlocked) {
      return books
    } else {
      return books?.filter(
        (book) => intersection(protectedTagIds, book?.tags || []).length === 0
      )
    }
  }, [books, protectedTagIds, isLibraryUnlocked])

  return { data, isLoading: isBooksLoading || isTagsLoading }
}
