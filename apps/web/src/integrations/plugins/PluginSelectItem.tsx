import type { LinkDocTypeForSource, SourceType } from "@oboku/shared"
import { getPluginByType } from "./configure"
import type { SelectItemComponentProps } from "./types"

export function PluginSelectItem<T extends SourceType>({
  link,
  ...props
}: Omit<SelectItemComponentProps<T>, "currentLinkData"> & {
  link: LinkDocTypeForSource<T>
}) {
  const { SelectItemComponent } = getPluginByType(link.type)

  if (!SelectItemComponent) return null

  return <SelectItemComponent {...props} currentLinkData={link.data} />
}
