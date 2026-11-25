import type { CollectionMetadata } from "../metadata"
import { mergeWith } from "../utils/mergeWith"

/**
 * Higher wins. A provider absent from this map (a document written by a newer
 * client) is merged first so known providers always take precedence over it.
 */
export const COLLECTION_METADATA_PRIORITY = {
  user: 6,
  mangadex: 5,
  mangaupdates: 4,
  biblioreads: 3,
  link: 2,
  googleBookApi: 1,
  comicvine: 0,
} as const satisfies Record<CollectionMetadata["type"], number>

const UNKNOWN_PROVIDER_PRIORITY = -1

/**
 * `CollectionMetadata` as read from a document: array fields are widened to
 * `readonly` so deeply-frozen documents (rxdb) can be passed without copying.
 */
export type CollectionMetadataEntry = Omit<
  CollectionMetadata,
  "aliases" | "authors"
> & {
  aliases?: readonly string[]
  authors?: readonly string[]
}

export type CollectionComputedMetadata = Omit<
  CollectionMetadataEntry,
  "type" | "title"
> & {
  title?: string | undefined
}

const getProviderPriority = (type: CollectionMetadata["type"]) =>
  COLLECTION_METADATA_PRIORITY[type] ?? UNKNOWN_PROVIDER_PRIORITY

/**
 * Flattens every metadata entry of a collection into a single view, letting
 * higher priority providers override lower ones. `undefined` and `null` values
 * never override an already resolved one.
 */
export const computeCollectionMetadata = (
  metadata: readonly (CollectionMetadataEntry | undefined)[],
): CollectionComputedMetadata =>
  metadata
    .filter(function isDefinedEntry(entry) {
      return entry !== undefined
    })
    .sort(function byAscendingPriority(a, b) {
      return getProviderPriority(a.type) - getProviderPriority(b.type)
    })
    .reduce<CollectionComputedMetadata>(function mergeEntryIntoView(
      acc,
      { type, ...entry },
    ) {
      const title = entry.title

      return mergeWith(
        acc,
        { ...entry, title: typeof title === "string" ? title : title?.en },
        function keepResolvedValueOverNull(objValue, srcValue) {
          if (srcValue === null) return objValue ?? srcValue

          return undefined
        },
      )
    }, {})
