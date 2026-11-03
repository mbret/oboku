import type { DataSourceType } from "@oboku/shared"
import { getPluginByType } from "./configure"
import type { UpsertFileComponentProps } from "./types"

export function PluginUpsertFile<T extends DataSourceType>({
  link,
  ...props
}: UpsertFileComponentProps<T>) {
  const { UpsertFileComponent } = getPluginByType(link.type)

  if (!UpsertFileComponent) {
    throw new Error(`Unsupported link type for upsert: ${link.type}`)
  }

  return <UpsertFileComponent {...props} link={link} />
}
