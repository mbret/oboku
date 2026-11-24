import {
  assertNever,
  type LibrarySyncDocType,
  type LibrarySyncDocTypeFor,
} from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { pluginsByType } from "./configure"

// TypeScript cannot narrow a generic discriminated-union parameter via
// control flow, so the runtime guard + assertion is the only safe option.
const librarySyncArgs = <T extends LibrarySyncDocType["type"]>(
  librarySync: DeepReadonly<LibrarySyncDocType> | null | undefined,
  type: T,
) => {
  const narrowed = (librarySync?.type === type ? librarySync : undefined) as
    | DeepReadonly<LibrarySyncDocTypeFor<T>>
    | undefined

  return { enabled: !!narrowed, librarySync: narrowed }
}

/**
 * Calls each plugin's `useLibrarySyncInfo` by name. Plugin members named `use*` are
 * hooks on purpose (see `SourcePlugin`), and hooks cannot run in a loop, so a
 * new plugin adds its line here.
 */
export const usePluginLibrarySyncLabel = (
  librarySync?: DeepReadonly<LibrarySyncDocType> | null,
) => {
  const drive = pluginsByType.DRIVE.useLibrarySyncInfo(
    librarySyncArgs(librarySync, "DRIVE"),
  )
  const dropbox = pluginsByType.dropbox.useLibrarySyncInfo(
    librarySyncArgs(librarySync, "dropbox"),
  )
  const oneDrive = pluginsByType["one-drive"].useLibrarySyncInfo(
    librarySyncArgs(librarySync, "one-drive"),
  )
  const file = pluginsByType.file.useLibrarySyncInfo(
    librarySyncArgs(librarySync, "file"),
  )
  const synologyDrive = pluginsByType["synology-drive"].useLibrarySyncInfo(
    librarySyncArgs(librarySync, "synology-drive"),
  )
  const uri = pluginsByType.URI.useLibrarySyncInfo(
    librarySyncArgs(librarySync, "URI"),
  )
  const webdav = pluginsByType.webdav.useLibrarySyncInfo(
    librarySyncArgs(librarySync, "webdav"),
  )
  const server = pluginsByType.server.useLibrarySyncInfo(
    librarySyncArgs(librarySync, "server"),
  )
  const opds = pluginsByType.opds.useLibrarySyncInfo(
    librarySyncArgs(librarySync, "opds"),
  )

  const librarySyncType = librarySync?.type

  switch (librarySyncType) {
    case "DRIVE":
      return drive?.name
    case "dropbox":
      return dropbox?.name
    case "one-drive":
      return oneDrive?.name
    case "file":
      return file?.name
    case "synology-drive":
      return synologyDrive?.name
    case "URI":
      return uri?.name
    case "webdav":
      return webdav?.name
    case "server":
      return server?.name
    case "opds":
      return opds?.name
    case undefined:
      return undefined
    default:
      return assertNever(librarySyncType)
  }
}
