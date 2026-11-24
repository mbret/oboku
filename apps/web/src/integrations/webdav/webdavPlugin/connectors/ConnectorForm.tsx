import { Button } from "@mui/material"
import { memo } from "react"
import { ConnectorForm as GenericConnectorForm } from "../../../../connectors/ConnectorForm"
import { useUnlockMasterKey } from "../../../../secrets/useUnlockMasterKey"
import { useTestWebdavConnection } from "../useTestWebdavConnection"
import { WebdavRequirementsAlert } from "../WebdavRequirementsAlert"

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
