import { ReadingStateState } from "@oboku/shared"
import { useBooks } from "../books/states"
import { useCollection } from "./useCollection"

export const useCollectionReadingProgress = ({
  id,
}: {
  id: string | undefined
}) => {
  const { data: collection } = useCollection({ id })
  const { data: books } = useBooks({ ids: collection?.books })

  if (!books || books.length === 0) return undefined

  const totalProgressPercent = books.reduce((acc, item) => {
    // A finished book always counts as fully read even if the user went
    // back and the stored progress is < 1.
    if (item.readingStateCurrentState === ReadingStateState.Finished) {
      return acc + 1
    }

    return acc + (item.readingStateCurrentBookmarkProgressPercent ?? 0)
  }, 0)

  return totalProgressPercent / books.length
}
