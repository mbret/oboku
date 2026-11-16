import { Button } from "@mui/material"
import { memo } from "react"
import type {
  ConnectionParams,
  TestConnectionFn,
} from "../../../../connectors/TestConnection"
import { ConnectorForm as GenericConnectorForm } from "../../../../connectors/ConnectorForm"
import { useUnlockMasterKey } from "../../../../secrets/useUnlockMasterKey"
import { connectWebdav } from "../auth/connect"
import { WebdavRequirementsAlert } from "../WebdavRequirementsAlert"

export type WebdavConnectionParams = ConnectionParams & { directory?: string }

const toPath = (params: WebdavConnectionParams) =>
  `/${params.directory ?? ""}`.replace(/\/+/g, "/") || "/"

export const testConnection: TestConnectionFn<WebdavConnectionParams> = async (
  params,
) => {
  try {
    await connectWebdav({
      url: params.url,
      username: params.username,
      password: params.password,
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
      showConnectThroughServer
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
