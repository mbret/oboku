import { getReadingStateReachedProgress } from "@oboku/shared"
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

  const totalProgressPercent = books.reduce(
    (acc, item) => acc + getReadingStateReachedProgress(item),
    0,
  )

  return totalProgressPercent / books.length
}
