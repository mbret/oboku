import type { MetadataFileDownloadOverride } from "@oboku/shared"
import type { LibrarySyncSubmitPayload } from "../types"

/**
 * Minimal subset of a library sync document needed to seed a plugin form. All
 * fields are optional so the same helper works for both create (no
 * `librarySync`) and edit flows.
 */
type FormDefaultsSource = {
  readonly name?: string | null
  readonly tags?: readonly string[]
  readonly metadataFileDownloadEnabled?: boolean | null
}

/**
 * Shared base of `defaultValues` for every plugin's library sync form (name,
 * tags, metadata-policy override). Plugins spread the result alongside their
 * own source-specific fields, e.g.
 *
 * ```ts
 * defaultValues: {
 *   ...getLibrarySyncFormBaseDefaults(librarySync),
 *   folderId: librarySync?.data_v2?.folderId ?? "",
 * }
 * ```
 */
export const getLibrarySyncFormBaseDefaults = (
  librarySync?: FormDefaultsSource,
): {
  name: string
  tags: string[]
  metadataFileDownloadEnabled: MetadataFileDownloadOverride
} => ({
  name: librarySync?.name ?? "",
  tags: [...(librarySync?.tags ?? [])],
  metadataFileDownloadEnabled: librarySync?.metadataFileDownloadEnabled ?? null,
})

/**
 * Assembles the submit payload from a plugin form's `data` and source
 * specific `data_v2`. Lets each plugin focus on its own `data_v2` shape and
 * keeps the shared base fields in one place.
 */
export const buildLibrarySyncSubmitPayload = (
  data: ReturnType<typeof getLibrarySyncFormBaseDefaults>,
  data_v2: Record<string, unknown>,
): LibrarySyncSubmitPayload => ({
  name: data.name,
  tags: data.tags,
  metadataFileDownloadEnabled: data.metadataFileDownloadEnabled,
  data_v2,
})
