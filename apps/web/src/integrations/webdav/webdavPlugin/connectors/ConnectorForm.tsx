import { Button } from "@mui/material"
import { memo } from "react"
import type {
  ConnectionParams,
  TestConnectionFn,
} from "../../../../connectors/TestConnection"
import { ConnectorForm as GenericConnectorForm } from "../../../../connectors/ConnectorForm"
import { useHttpClientApi } from "../../../../http"
import { useUnlockMasterKey } from "../../../../secrets/useUnlockMasterKey"
import { createWebdavDirectoryLister } from "../listDirectory"
import { WebdavRequirementsAlert } from "../WebdavRequirementsAlert"

export type WebdavConnectionParams = ConnectionParams & {
  directory?: string
  proxyThroughServer?: boolean
}

const toPath = (params: WebdavConnectionParams) =>
  `/${params.directory ?? ""}`.replace(/\/+/g, "/") || "/"

export const useTestWebdavConnection =
  (): TestConnectionFn<WebdavConnectionParams> => {
    const httpClientApi = useHttpClientApi()

    return async function testWebdavConnection(params) {
      const listDirectory = createWebdavDirectoryLister({
        connection: params,
        isProxiedThroughServer: params.proxyThroughServer === true,
        httpClientApi,
      })

      try {
        await listDirectory(toPath(params))
        return true
      } catch {
        return false
      }
    }
  }

export const ConnectorForm = memo(function ConnectorForm({
  onSubmitSuccess,
  children,
  connectorId,
}: {
  onSubmitSuccess: () => void
  children?: React.ReactNode
  connectorId?: string
}) {
  const { masterKey, unlockMasterKey } = useUnlockMasterKey()
  const testConnection = useTestWebdavConnection()

  return (
    <GenericConnectorForm
      connectorId={connectorId}
      connectorType="webdav"
      showProxyThroughServer
      onSubmitSuccess={onSubmitSuccess}
      testConnection={testConnection}
      renderExtraActions={() => (
        <Button disabled={!!masterKey} onClick={unlockMasterKey}>
          {masterKey ? "Unlocked" : "Unlock secrets"}
        </Button>
      )}
      topAlert={<WebdavRequirementsAlert />}
    >
      {children}
    </GenericConnectorForm>
  )
})
