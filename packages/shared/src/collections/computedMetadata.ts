import type { CollectionMetadata } from "../metadata"
import { mergeWith } from "../utils/mergeWith"

/**
 * Higher wins. A source absent from this map (a document written by a newer
 * client) is merged first so known sources always take precedence over it.
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

const UNKNOWN_SOURCE_PRIORITY = -1

/**
 * `CollectionMetadata` as read from a document: array fields are widened to
 * `readonly` so deeply-frozen documents (rxdb) can be passed without copying.
 */
export type CollectionMetadataSource = Omit<
  CollectionMetadata,
  "aliases" | "authors"
> & {
  aliases?: readonly string[]
  authors?: readonly string[]
}

export type CollectionComputedMetadata = Omit<
  CollectionMetadataSource,
  "type" | "title"
> & {
  title?: string | undefined
}

const getSourcePriority = (type: CollectionMetadata["type"]) =>
  COLLECTION_METADATA_PRIORITY[type] ?? UNKNOWN_SOURCE_PRIORITY

/**
 * Flattens every metadata source of a collection into a single view, letting
 * higher priority sources override lower ones. `undefined` and `null` values
 * never override an already resolved one.
 */
export const computeCollectionMetadata = (
  metadata: readonly (CollectionMetadataSource | undefined)[],
): CollectionComputedMetadata =>
  metadata
    .filter((entry) => entry !== undefined)
    .sort((a, b) => getSourcePriority(a.type) - getSourcePriority(b.type))
    .reduce<CollectionComputedMetadata>((acc, { type, ...entry }) => {
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
