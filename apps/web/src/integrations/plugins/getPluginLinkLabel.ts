import type { DataSourceType, LinkDataForProvider } from "@oboku/shared"
import { getPluginByType } from "./configure"

export function getPluginLinkLabel<T extends DataSourceType>(link: {
  type: T
  data: LinkDataForProvider<T>
}) {
  return getPluginByType(link.type).getLinkLabel(link.data)
}
