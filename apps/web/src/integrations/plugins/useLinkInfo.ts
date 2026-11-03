import type { DataSourceType, LinkDataForProvider } from "@oboku/shared"
import { useBook } from "../../books/states"
import { useLink } from "../../links/states"
import { getPluginByType } from "./configure"

function getLinkLabel<T extends DataSourceType>(link: {
  type: T
  data: LinkDataForProvider<T>
}) {
  return getPluginByType(link.type).getLinkLabel(link.data)
}

export const useLinkInfo = (bookId?: string) => {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })

  return { data: { label: link ? getLinkLabel(link) : undefined } }
}
