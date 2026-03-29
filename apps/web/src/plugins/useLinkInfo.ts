import { assertNever } from "@oboku/shared"
import { useBook } from "../books/states"
import { useLink } from "../links/states"
import { pluginsByType } from "./configure"

export const useLinkInfo = (bookId?: string) => {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const dropboxLinkInfo = pluginsByType.dropbox.useLinkInfo({
    enabled: link?.type === "dropbox",
    linkData: link?.data,
  })

  const webdavLinkInfo = pluginsByType.webdav.useLinkInfo({
    enabled: link?.type === "webdav",
    linkData: link?.data,
  })

  const driveLinkInfo = pluginsByType.DRIVE.useLinkInfo({
    enabled: link?.type === "DRIVE",
    linkData: link?.data,
  })

  const synologyDriveLinkInfo = pluginsByType["synology-drive"].useLinkInfo({
    enabled: link?.type === "synology-drive",
    linkData: link?.data,
  })
  const fileLinkInfo = pluginsByType.file.useLinkInfo({
    enabled: link?.type === "file",
    linkData: link?.data,
  })
  const uriLinkInfo = pluginsByType.URI.useLinkInfo({
    enabled: link?.type === "URI",
    linkData: link?.data,
  })
  const serverLinkInfo = pluginsByType.server.useLinkInfo({
    enabled: link?.type === "server",
    linkData: link?.data,
  })
  const linkType = link?.type

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
    case "server":
      return serverLinkInfo
    case undefined:
      return { data: { label: undefined } }
    default:
      return assertNever(linkType)
  }
}
