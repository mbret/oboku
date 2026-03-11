import { memo } from "react"
import type { FileStat } from "webdav"
import { connectWebdav } from "../auth/connect"
import { useExtractConnectorData } from "../../../connectors/useExtractConnectorData"
import {
  UploadConnectorSelectionStep,
  type UploadConnectorSelectionStepProps,
} from "../../../upload/UploadConnectorSelectionStep"

export type WebdavAuthResult = {
  client: import("webdav").WebDAVClient
  connectorId: string
  items: FileStat[]
}

export const ConnectorSelectionStep = memo(
  (
    props: Omit<
      UploadConnectorSelectionStepProps<WebdavAuthResult>,
      "authenticate"
    >,
  ) => {
    const { onAuthenticated, ...rest } = props
    const { mutateAsync: extractConnectorData } = useExtractConnectorData({
      type: "webdav",
    })

    return (
      <UploadConnectorSelectionStep<WebdavAuthResult>
        {...rest}
        onAuthenticated={onAuthenticated}
        authenticate={async (connectorId) => {
          const { data } = await extractConnectorData({ connectorId })
          const { client, items } = await connectWebdav({
            url: data.url,
            username: data.username,
            password: data.password,
            path: "/",
          })
          return { client, connectorId, items }
        }}
      />
    )
  },
)
