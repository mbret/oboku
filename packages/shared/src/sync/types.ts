import type { DataSourceType, LinkDataForProvider } from "../db/docTypes"

type NameWithMetadata = string
type ISOString = string

/**
 * Sync item; generic in the provider type so linkData is correctly typed per provider.
 * linkData carries the plugin-specific identity and access fields for this item.
 */
export type SynchronizeAbleItem<
  TProvider extends DataSourceType = DataSourceType,
> = {
  type: `file` | `folder`
  name: NameWithMetadata
  items?: SynchronizeAbleItem<TProvider>[]
  modifiedAt: ISOString
  tags?: string[]
  linkData: LinkDataForProvider<TProvider>
}

/**
 * Result of a plugin sync; generic in the provider type.
 */
export type SynchronizeAbleDataSource<
  TProvider extends DataSourceType = DataSourceType,
> = {
  items: SynchronizeAbleItem<TProvider>[]
}
