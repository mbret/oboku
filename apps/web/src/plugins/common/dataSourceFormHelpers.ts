import type { MetadataFileDownloadOverride } from "@oboku/shared"
import type { DataSourceSubmitPayload } from "../types"

/**
 * Minimal subset of a data source document needed to seed a plugin form. All
 * fields are optional so the same helper works for both create (no
 * `dataSource`) and edit flows.
 */
type FormDefaultsSource = {
  readonly name?: string | null
  readonly tags?: readonly string[]
  readonly metadataFileDownloadEnabled?: boolean | null
}

/**
 * Shared base of `defaultValues` for every plugin's data source form (name,
 * tags, metadata-policy override). Plugins spread the result alongside their
 * own provider-specific fields, e.g.
 *
 * ```ts
 * defaultValues: {
 *   ...getDataSourceFormBaseDefaults(dataSource),
 *   folderId: dataSource?.data_v2?.folderId ?? "",
 * }
 * ```
 */
export const getDataSourceFormBaseDefaults = (
  dataSource?: FormDefaultsSource,
): {
  name: string
  tags: string[]
  metadataFileDownloadEnabled: MetadataFileDownloadOverride
} => ({
  name: dataSource?.name ?? "",
  tags: [...(dataSource?.tags ?? [])],
  metadataFileDownloadEnabled: dataSource?.metadataFileDownloadEnabled ?? null,
})

/**
 * Assembles the submit payload from a plugin form's `data` and provider
 * specific `data_v2`. Lets each plugin focus on its own `data_v2` shape and
 * keeps the shared base fields in one place.
 */
export const buildDataSourceSubmitPayload = (
  data: ReturnType<typeof getDataSourceFormBaseDefaults>,
  data_v2: Record<string, unknown>,
): DataSourceSubmitPayload => ({
  name: data.name,
  tags: data.tags,
  metadataFileDownloadEnabled: data.metadataFileDownloadEnabled,
  data_v2,
})
