import { useSignalValue } from "reactjrx"
import { readerSignal } from "../states"
import { useBook } from "../../books/states"
import { directives } from "@oboku/shared"

export const useIsUsingPagesPerChapter = ({ bookId }: { bookId?: string }) => {
  const reader = useSignalValue(readerSignal)
  const { data: book } = useBook({ id: bookId })
  const linkMetadata = book?.metadata?.find(
    (metadata) => metadata.type === "link"
  )
  const { isWebtoon } = directives.extractDirectivesFromName(
    linkMetadata?.title ?? ``
  )
  const { renditionLayout } = reader?.context.manifest ?? {}

  if (isWebtoon) {
    return false
  }

  if (renditionLayout === "reflowable") return true

  return false
}
