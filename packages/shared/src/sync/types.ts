import type { SourceType, LinkDataForSource } from "../db/docTypes"

type NameWithMetadata = string
type ISOString = string

/**
 * Sync item; generic in the provider type so linkData is correctly typed per provider.
 * linkData carries the plugin-specific identity and access fields for this item.
 */
export type SynchronizeAbleItem<TSourceType extends SourceType = SourceType> = {
  type: `file` | `folder`
  name: NameWithMetadata
  items?: SynchronizeAbleItem<TSourceType>[]
  modifiedAt: ISOString
  tags?: string[]
  linkData: LinkDataForSource<TSourceType>
}

/**
 * Result of a plugin sync; generic in the provider type.
 */
export type SynchronizeAbleLibrarySync<
  TSourceType extends SourceType = SourceType,
> = {
  items: SynchronizeAbleItem<TSourceType>[]
}
