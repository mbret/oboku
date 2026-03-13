import { assertNever } from "@oboku/shared"
import { useBook } from "../books/states"
import { useLink } from "../links/states"
import { pluginsByType } from "./configure"

export const useLinkInfo = (bookId?: string) => {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const dropboxLinkInfo = pluginsByType.dropbox.useLinkInfo({
    enabled: link?.type === "dropbox",
    resourceId: link?.resourceId,
  })

  const webdavLinkInfo = pluginsByType.webdav.useLinkInfo({
    enabled: link?.type === "webdav",
    resourceId: link?.resourceId,
  })

  const driveLinkInfo = pluginsByType.DRIVE.useLinkInfo({
    enabled: link?.type === "DRIVE",
    resourceId: link?.resourceId,
  })

  const synologyDriveLinkInfo = pluginsByType["synology-drive"].useLinkInfo({
    enabled: link?.type === "synology-drive",
    resourceId: link?.resourceId,
  })
  const fileLinkInfo = pluginsByType.file.useLinkInfo({
    enabled: link?.type === "file",
    resourceId: link?.resourceId,
  })
  const uriLinkInfo = pluginsByType.URI.useLinkInfo({
    enabled: link?.type === "URI",
    resourceId: link?.resourceId,
  })
  const linkType = link?.type
  const resourceId = link?.resourceId

  switch (linkType) {
    case "dropbox":
      return dropboxLinkInfo
    case "webdav":
      return webdavLinkInfo
    case "DRIVE":
      return driveLinkInfo
    case "synology-drive":
      return synologyDriveLinkInfo
    case "file":
      return fileLinkInfo
    case "URI":
      return uriLinkInfo
    case undefined:
      return { data: { label: resourceId } }
    default:
      return assertNever(linkType)
  }
}
