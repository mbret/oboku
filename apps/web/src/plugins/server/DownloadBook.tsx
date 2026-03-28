import { explodeServerResourceId, getServerLinkData } from "@oboku/shared"
import { memo } from "react"
import type { DownloadBookComponentProps } from "../types"
import { WebdavDownloadBook } from "../webdav/DownloadBook"
import { configuration } from "../../config/configuration"

export const DownloadBook = memo(function DownloadBook(
  props: DownloadBookComponentProps,
) {
  const { connectorId } = getServerLinkData(props.link.data ?? {})
  const { filePath } = explodeServerResourceId(props.link.resourceId)

  return (
    <WebdavDownloadBook
      {...props}
      connectorType="server"
      connectorId={connectorId}
      filePath={filePath}
      webdavUrl={configuration.API_WEBDAV_URL}
    />
  )
})
