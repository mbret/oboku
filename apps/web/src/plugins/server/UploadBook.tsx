import { memo } from "react"
import type { UploadBookComponentProps } from "../types"
import { WebdavUploadBook } from "../webdav/UploadBook"
import { useConfig } from "../../config/useConfig"

export const UploadBook = memo(function UploadBook(
  props: UploadBookComponentProps<"server">,
) {
  const { data: config } = useConfig()

  return (
    <WebdavUploadBook
      {...props}
      connectorType="server"
      headerSubtitle="Connected to oboku server"
      maxConnectors={1}
      webdavUrl={config?.API_WEBDAV_URL}
    />
  )
})
