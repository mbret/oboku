import {
  type BookDocType,
  type CollectionDocType,
  type MetadataFetchOverride,
  resolveMetadataFetchEnabled,
} from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { useIsBookProtected } from "../books/states"
import { useIsCollectionProtected } from "../collections/useIsCollectionProtected"

type Target =
  | {
      kind: "book"
      book?: DeepReadonlyObject<BookDocType> | null
    }
  | {
      kind: "collection"
      collection?: DeepReadonlyObject<CollectionDocType> | null
    }

type Result = {
  /** What the user explicitly persisted (`undefined`/`null` when "default"). */
  override: MetadataFetchOverride
  /** Whether the item is currently protected (any related tag has `isProtected`). */
  isProtected: boolean | undefined
  /**
   * Final policy: `true` if external metadata fetching should run.
   * `undefined` while the protection state is loading.
   */
  resolved: boolean | undefined
}

/**
 * Short human label for the persisted override (the tri-state surfaced to the
 * user as "Default / Always / Never").
 */
export const formatMetadataFetchOverride = (
  override: MetadataFetchOverride,
): "Always" | "Never" | "Default" => {
  if (override === true) return "Always"
  if (override === false) return "Never"
  return "Default"
}

/**
 * Long human label combining the persisted policy with the current resolved
 * behaviour. Used as the `secondary` text on list items that open the policy
 * dialog.
 */
export const formatMetadataFetchSecondary = ({
  override,
  isProtected,
  resolved,
}: {
  override: MetadataFetchOverride
  isProtected: boolean | undefined
  resolved: boolean | undefined
}): string => {
  const policy = formatMetadataFetchOverride(override)

  if (isProtected === undefined || resolved === undefined) {
    return policy
  }

  return `${policy} \u2014 currently ${
    resolved ? "fetching" : "not fetching"
  } external metadata (this item is${isProtected ? "" : " not"} protected)`
}

/**
 * Description used under the "Default" radio inside the policy dialog. Mirrors
 * the resolved behaviour without repeating the policy name.
 */
export const formatMetadataFetchDefaultDescription = ({
  isProtected,
  resolved,
}: {
  isProtected: boolean | undefined
  resolved: boolean | undefined
}): string => {
  if (isProtected === undefined || resolved === undefined) {
    return "Decide based on protection."
  }

  return `Currently ${resolved ? "fetching" : "not fetching"} because this item is${
    isProtected ? "" : " not"
  } protected.`
}

/**
 * Computes the effective metadata-fetch policy for a book or a collection
 * using the same rule as the server (`resolveMetadataFetchEnabled`). UI uses
 * this to surface the current behaviour and to disable refresh entry points
 * when the policy is "never".
 */
export const useResolvedMetadataFetchEnabled = (target: Target): Result => {
  const bookProtection = useIsBookProtected(
    target.kind === "book" ? target.book : null,
  )
  const collectionProtection = useIsCollectionProtected(
    target.kind === "collection" ? target.collection : null,
  )

  const isProtected =
    target.kind === "book" ? bookProtection.data : collectionProtection.data

  const override =
    target.kind === "book"
      ? target.book?.metadataFetchEnabled
      : target.collection?.metadataFetchEnabled

  const resolved =
    isProtected === undefined
      ? undefined
      : resolveMetadataFetchEnabled(override, isProtected)

  return { override, isProtected, resolved }
}
