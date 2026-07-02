import { memo } from "react"
import type { DownloadBookComponentProps } from "../types"
import { WebdavDownloadBook } from "../webdav/DownloadBook"
import { useConfig } from "../../config/useConfig"

export const DownloadBook = memo(function DownloadBook(
  props: DownloadBookComponentProps<"server">,
) {
  const { data: config } = useConfig()
  const { connectorId, filePath } = props.link.data

  return (
    <WebdavDownloadBook
      {...props}
      connectorType="server"
      connectorId={connectorId}
      filePath={filePath}
      webdavUrl={config?.API_WEBDAV_URL}
    />
  )
})
