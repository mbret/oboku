import { Alert } from "@mui/material"
import { memo } from "react"
import type { TestConnectionFn } from "../../../connectors/TestConnection"
import { ConnectorForm as GenericConnectorForm } from "../../../connectors/ConnectorForm"
import { signInSynologyDrive } from "../client"

export const testConnection: TestConnectionFn = async (params) => {
  try {
    await signInSynologyDrive({
      baseUrl: params.url,
      username: params.username,
      password: params.password,
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
  }) => (
    <GenericConnectorForm
      connectorId={connectorId}
      connectorType="synology-drive"
      onSubmitSuccess={onSubmitSuccess}
      testConnection={testConnection}
      topAlert={
        <Alert severity="info">
          Synology connectors store your NAS URL, username, and a reference to a
          secret containing the password.
        </Alert>
      }
    >
      {children}
    </GenericConnectorForm>
  ),
)
