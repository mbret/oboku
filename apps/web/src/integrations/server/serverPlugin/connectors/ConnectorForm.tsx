import { Alert } from "@mui/material"
import { memo } from "react"
import { ConnectorForm as GenericConnectorForm } from "../../../../connectors/ConnectorForm"

export const ConnectorForm = memo(function ConnectorForm({
  onSubmitSuccess,
  children,
  connectorId,
}: {
  onSubmitSuccess: () => void
  children?: React.ReactNode
  connectorId?: string
}) {
  return (
    <GenericConnectorForm
      connectorId={connectorId}
      connectorType="server"
      onSubmitSuccess={onSubmitSuccess}
      showUrl={false}
      topAlert={
        <Alert severity="info">
          Use the credentials provided on the admin panel.
        </Alert>
      }
    >
      {children}
    </GenericConnectorForm>
  )
})
