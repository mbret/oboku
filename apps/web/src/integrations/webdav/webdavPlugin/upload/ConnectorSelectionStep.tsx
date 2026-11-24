import { memo } from "react"
import type { WebdavDirectoryItemDto } from "@oboku/shared"
import { resolveWebdavUrl } from "../auth/connect"
import type { WebdavBackedType } from "../constants"
import { createWebdavDirectoryLister } from "../listDirectory"
import { isProxiedThroughServer } from "../../../../connectors/connectorDetails"
import { useExtractConnectorData } from "../../../../connectors/useExtractConnectorData"
import { useHttpClientApi } from "../../../../http"
import {
  UploadConnectorSelectionStep,
  type UploadConnectorSelectionStepProps,
} from "../../../../upload/UploadConnectorSelectionStep"

export type WebdavAuthResult = {
  connectorId: string
  items: WebdavDirectoryItemDto[]
  listDirectory: (path: string) => Promise<WebdavDirectoryItemDto[]>
  url: string
}

export const ConnectorSelectionStep = memo(function ConnectorSelectionStep({
  webdavUrl,
  ...props
}: Omit<
  UploadConnectorSelectionStepProps<WebdavAuthResult>,
  "authenticate" | "connectorType"
> & {
  connectorType: WebdavBackedType
  webdavUrl?: string
}) {
  const { mutateAsync: extractConnectorData } = useExtractConnectorData({
    type: props.connectorType,
  })
  const httpClientApi = useHttpClientApi()

  const authenticate = async (
    connectorId: string,
  ): Promise<WebdavAuthResult> => {
    const { data } = await extractConnectorData({ connectorId })
    const url = resolveWebdavUrl({ connectorUrl: data.url, webdavUrl })

    const listDirectory = createWebdavDirectoryLister({
      connection: {
        url,
        username: data.username,
        password: data.password,
        allowSelfSigned: data.allowSelfSigned,
      },
      isProxiedThroughServer: isProxiedThroughServer(data),
      httpClientApi,
    })

    return { connectorId, items: await listDirectory("/"), listDirectory, url }
  }

  return (
    <UploadConnectorSelectionStep<WebdavAuthResult>
      {...props}
      authenticate={authenticate}
    />
  )
})
