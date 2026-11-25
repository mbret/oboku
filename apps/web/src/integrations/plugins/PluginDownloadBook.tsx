import type { SourceType } from "@oboku/shared"
import { getPluginByType } from "./configure"
import type { DownloadBookComponentProps } from "./types"

export function PluginDownloadBook<T extends SourceType>({
  link,
  ...props
}: DownloadBookComponentProps<T>) {
  const { DownloadBookComponent } = getPluginByType(link.type)

  return <DownloadBookComponent {...props} link={link} />
}
