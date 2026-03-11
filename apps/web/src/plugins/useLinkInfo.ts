import { useBook } from "../books/states"
import { useLink } from "../links/states"
import { useLinkInfo as useDropboxLinkInfo } from "./dropbox/useLinkInfo"
import { useLinkInfo as useWebdavLinkInfo } from "./webdav/useLinkInfo"
import { useLinkInfo as useGoogleLinkInfo } from "./google/useLinkInfo"
import { useLinkInfo as useSynologyDriveLinkInfo } from "./synology-drive/useLinkInfo"

export const useLinkInfo = (bookId?: string) => {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })

  const dropboxLinkInfo = useDropboxLinkInfo({
    enabled: link?.type === "dropbox",
    resourceId: link?.resourceId,
  })

  const webdavLinkInfo = useWebdavLinkInfo({
    enabled: link?.type === "webdav",
    resourceId: link?.resourceId,
  })

  const googleLinkInfo = useGoogleLinkInfo({
    enabled: link?.type === "DRIVE",
    resourceId: link?.resourceId,
  })

  const synologyDriveLinkInfo = useSynologyDriveLinkInfo({
    enabled: link?.type === "synology-drive",
    resourceId: link?.resourceId,
  })

  if (link?.type === "dropbox") {
    return dropboxLinkInfo
  }

  if (link?.type === "webdav") {
    return webdavLinkInfo
  }

  if (link?.type === "DRIVE") {
    return googleLinkInfo
  }

  if (link?.type === "synology-drive") {
    return synologyDriveLinkInfo
  }

  return {
    data: {
      label: link?.resourceId,
    },
  }
}
