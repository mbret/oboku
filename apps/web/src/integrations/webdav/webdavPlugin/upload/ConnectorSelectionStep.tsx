import { memo } from "react"
import type { FileStat, WebDAVClient } from "webdav"
import { connectWebdav, resolveWebdavUrl } from "../auth/connect"
import type { WebdavBackedType } from "../constants"
import type { ConnectorDetails } from "../../../plugins/types"
import { useExtractConnectorData } from "../../../../connectors/useExtractConnectorData"
import {
  UploadConnectorSelectionStep,
  type UploadConnectorSelectionStepProps,
} from "../../../../upload/UploadConnectorSelectionStep"

export type WebdavAuthResult = {
  client: WebDAVClient
  connectorId: string
  items: FileStat[]
  url: string
}

export const ConnectorSelectionStep = memo(function ConnectorSelectionStep({
  webdavUrl,
  ...props
}: Omit<
  UploadConnectorSelectionStepProps<WebdavAuthResult>,
  "authenticate" | "connector"
> & {
  connector: ConnectorDetails<WebdavBackedType>
  webdavUrl?: string
}) {
  const { mutateAsync: extractConnectorData } = useExtractConnectorData({
    type: props.connector.type,
  })

  const authenticate = async (connectorId: string) => {
    const { data } = await extractConnectorData({ connectorId })
    const url = resolveWebdavUrl({ connectorUrl: data.url, webdavUrl })
    const { client, items } = await connectWebdav({
      url,
      username: data.username,
      password: data.password,
      path: "/",
    })

    return { client, connectorId, items, url }
  }

  return (
    <UploadConnectorSelectionStep<WebdavAuthResult>
      {...props}
      authenticate={authenticate}
    />
  )
})
