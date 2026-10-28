import { assertNever, type LinkDocType } from "@oboku/shared"
import { pluginsByType } from "./configure"
import type { RemoveResourceResult } from "./types"
import { useMutation } from "@tanstack/react-query"

export type RemoveResourceGroup = {
  type: LinkDocType["type"]
  links: readonly LinkDocType[]
}

export type RemoveResourceGroupHandler = (
  group: RemoveResourceGroup,
) => Promise<RemoveResourceResult<LinkDocType["type"]>>

const isLinkOfType =
  <T extends LinkDocType["type"]>(type: T) =>
  (link: LinkDocType): link is Extract<LinkDocType, { type: T }> =>
    link.type === type

export const usePluginRemoveResource = () => {
  const removeResourceFromWebdav = pluginsByType.webdav.useRemoveResource()
  const removeResourceFromDropbox = pluginsByType.dropbox.useRemoveResource()
  const removeResourceFromSynologyDrive =
    pluginsByType["synology-drive"].useRemoveResource()
  const removeResourceFromDrive = pluginsByType.DRIVE.useRemoveResource()
  const removeResourceFromOneDrive =
    pluginsByType["one-drive"].useRemoveResource()
  const removeResourceFromFile = pluginsByType.file.useRemoveResource()
  const removeResourceFromUri = pluginsByType.URI.useRemoveResource()
  const removeResourceFromServer = pluginsByType.server.useRemoveResource()

  return useMutation({
    mutationFn: async (group: RemoveResourceGroup) => {
      switch (group.type) {
        case "webdav":
          return removeResourceFromWebdav(
            group.links.filter(isLinkOfType("webdav")),
          )
        case "synology-drive":
          return removeResourceFromSynologyDrive(
            group.links.filter(isLinkOfType("synology-drive")),
          )
        case "dropbox":
          return removeResourceFromDropbox(
            group.links.filter(isLinkOfType("dropbox")),
          )
        case "DRIVE":
          return removeResourceFromDrive(
            group.links.filter(isLinkOfType("DRIVE")),
          )
        case "one-drive":
          return removeResourceFromOneDrive(
            group.links.filter(isLinkOfType("one-drive")),
          )
        case "file":
          return removeResourceFromFile(
            group.links.filter(isLinkOfType("file")),
          )
        case "URI":
          return removeResourceFromUri(group.links.filter(isLinkOfType("URI")))
        case "server":
          return removeResourceFromServer(
            group.links.filter(isLinkOfType("server")),
          )
        default:
          return assertNever(group.type)
      }
    },
  })
}
