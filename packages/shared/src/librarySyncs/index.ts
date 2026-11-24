import type { SourceType } from "@oboku/shared"
import type { LibrarySyncDocType } from "../db/docTypes"

export const getDataFromLibrarySync = <T extends SourceType>(
  librarySync: Pick<Extract<LibrarySyncDocType, { type: T }>, "data_v2">,
): Extract<LibrarySyncDocType, { type: T }>["data_v2"] | undefined => {
  // compat with old library syncs
  if (
    librarySync &&
    "data" in librarySync &&
    librarySync.data &&
    typeof librarySync.data === "string"
  ) {
    try {
      return JSON.parse(librarySync.data)
    } catch (_e) {
      return undefined
    }
  } else if (librarySync.data_v2) {
    // TS distributes `Extract<LibrarySyncDocType, { type: T }>` over the union
    // and intersects the per-member `data_v2` shapes, which collapses to
    // `never` for non-matching sources. The input type already constrains
    // `data_v2` to the matching member, so this is sound at runtime; `any` is
    // the only escape hatch from the distribution.
    return librarySync.data_v2 as any
  } else {
    return undefined
  }
}
