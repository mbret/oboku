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
      proxyThroughServerCaption="For a server that refuses requests from the browser (CORS), such as Koofr. oboku's server lists your folders, tests the connection and downloads your books, then passes them on to you. The downloads count towards your monthly download quota."
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
