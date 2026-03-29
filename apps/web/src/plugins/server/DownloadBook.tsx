import { memo } from "react"
import type { DownloadBookComponentProps } from "../types"
import { WebdavDownloadBook } from "../webdav/DownloadBook"
import { configuration } from "../../config/configuration"

export const DownloadBook = memo(function DownloadBook(
  props: DownloadBookComponentProps<"server">,
) {
  const { connectorId, filePath } = props.link.data

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
