import { useBooks } from "../books/states"
import { useCollection } from "./useCollection"

export const useCollectionReadingProgress = ({ id }: { id: string }) => {
  const { data: collection } = useCollection({ id })
  const { data: books } = useBooks({ ids: collection?.books })

  const totalProgressPercent =
    books?.reduce(
      (acc, item) =>
        acc + (item.readingStateCurrentBookmarkProgressPercent ?? 0),
      0
    ) ?? 0

  return totalProgressPercent / (books?.length || 1)
}
