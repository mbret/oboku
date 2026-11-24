import type { LibrarySyncDocType } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { usePluginLibrarySyncLabel } from "../integrations/plugins/usePluginLibrarySyncLabel"
import { useLibrarySync } from "./useLibrarySync"

/**
 * By priority
 * `name` -> `plugin.infer` -> `plugin.name`
 */
export const useLibrarySyncLabel = (
  librarySync?: DeepReadonly<LibrarySyncDocType> | null,
) => {
  const { data } = useLibrarySync(librarySync?._id)
  const pluginLabel = usePluginLibrarySyncLabel(librarySync)
  const librarySyncName = typeof data?.name === "string" ? data.name.trim() : ""

  if (librarySyncName.length > 0) {
    return librarySyncName
  }

  return pluginLabel ?? "Source"
}
