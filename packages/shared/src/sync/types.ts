import type { DataSourceType, LinkDataForProvider } from "../db/docTypes"

type NameWithMetadata = string
type ISOString = string

/**
 * Sync item; generic in the provider type so linkData is correctly typed per provider.
 * For "webdav" and "synology-drive", linkData is required (sync always sets connectorId).
 * @example
 * type WebdavSyncItem = SynchronizeAbleItem<"webdav">  // linkData: WebdavLinkData (required)
 */
export type SynchronizeAbleItem<
  TProvider extends DataSourceType = DataSourceType,
> = {
  type: `file` | `folder`
  /**
   * @important
   * Unique identifier for this item which would not clash with other items that would
   * not point to the same resource.
   */
  resourceId: string
  name: NameWithMetadata
  items?: SynchronizeAbleItem<TProvider>[]
  modifiedAt: ISOString
  tags?: string[]
} & (TProvider extends "webdav" | "synology-drive"
  ? { linkData: LinkDataForProvider<TProvider> }
  : { linkData?: LinkDataForProvider<TProvider> })

/**
 * Result of a plugin sync; generic in the provider type.
 */
export type SynchronizeAbleDataSource<
  TProvider extends DataSourceType = DataSourceType,
> = {
  items: SynchronizeAbleItem<TProvider>[]
}
