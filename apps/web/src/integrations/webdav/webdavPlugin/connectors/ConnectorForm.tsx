import { Button } from "@mui/material"
import { memo } from "react"
import type {
  ConnectionParams,
  TestConnectionFn,
} from "../../../../connectors/TestConnection"
import { ConnectorForm as GenericConnectorForm } from "../../../../connectors/ConnectorForm"
import { useUnlockMasterKey } from "../../../../secrets/useUnlockMasterKey"
import { createWebdavClient } from "../auth/connect"
import { listDirectoryFromWebdavServer } from "../listDirectory"
import { WebdavRequirementsAlert } from "../WebdavRequirementsAlert"

export type WebdavConnectionParams = ConnectionParams & { directory?: string }

const toPath = (params: WebdavConnectionParams) =>
  `/${params.directory ?? ""}`.replace(/\/+/g, "/") || "/"

export const testConnection: TestConnectionFn<WebdavConnectionParams> = async (
  params,
) => {
  try {
    await listDirectoryFromWebdavServer({
      client: createWebdavClient({
        url: params.url,
        username: params.username,
        password: params.password,
      }),
      path: toPath(params),
    })
    return true
  } catch {
    return false
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
