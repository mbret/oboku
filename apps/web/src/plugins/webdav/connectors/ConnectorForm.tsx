import { Alert, Button, Link } from "@mui/material"
import { links } from "@oboku/shared"
import { memo } from "react"
import type {
  ConnectionParams,
  TestConnectionFn,
} from "../../../connectors/TestConnection"
import { ConnectorForm as GenericConnectorForm } from "../../../connectors/ConnectorForm"
import { useUnlockMasterKey } from "../../../secrets/useUnlockMasterKey"
import { connectWebdav } from "../auth/connect"

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

export const ConnectorForm = memo(
  ({
    onSubmitSuccess,
    children,
    connectorId,
  }: {
    onSubmitSuccess: () => void
    children?: React.ReactNode
    connectorId?: string
  }) => {
    const { masterKey, unlockMasterKey } = useUnlockMasterKey()

    return (
      <GenericConnectorForm
        connectorId={connectorId}
        connectorType="webdav"
        onSubmitSuccess={onSubmitSuccess}
        testConnection={testConnection}
        renderExtraActions={() => (
          <Button disabled={!!masterKey} onClick={unlockMasterKey}>
            {masterKey ? "Unlocked" : "Unlock secrets"}
          </Button>
        )}
        topAlert={
          <Alert severity="warning">
            Connecting to WebDAV server involves several requirements, make sure
            to <Link href={links.documentationConnectors}>read this</Link>{" "}
            before proceeding.
          </Alert>
        }
      >
        {children}
      </GenericConnectorForm>
    )
  },
)
