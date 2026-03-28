import { memo } from "react"
import type { FileStat } from "webdav"
import { connectWebdav } from "../../webdav/auth/connect"
import { useExtractConnectorData } from "../../../connectors/useExtractConnectorData"
import {
  UploadConnectorSelectionStep,
  type UploadConnectorSelectionStepProps,
} from "../../../upload/UploadConnectorSelectionStep"
import { configuration } from "../../../config/configuration"

export type ServerAuthResult = {
  client: import("webdav").WebDAVClient
  connectorId: string
  items: FileStat[]
}

export const ConnectorSelectionStep = memo(
  (
    props: Omit<
      UploadConnectorSelectionStepProps<ServerAuthResult>,
      "authenticate"
    >,
  ) => {
    const { onAuthenticated, ...rest } = props
    const { mutateAsync: extractConnectorData } = useExtractConnectorData({
      type: "server",
    })

    return (
      <UploadConnectorSelectionStep<ServerAuthResult>
        {...rest}
        maxConnectors={1}
        onAuthenticated={onAuthenticated}
        authenticate={async (connectorId) => {
          const { data } = await extractConnectorData({ connectorId })
          const { client, items } = await connectWebdav({
            url: configuration.API_WEBDAV_URL,
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
