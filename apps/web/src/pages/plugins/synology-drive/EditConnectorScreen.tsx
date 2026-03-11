import { memo } from "react"
import { EditConnectorScreen as GenericEditConnectorScreen } from "../../../connectors/EditConnectorScreen"
import { ConnectorForm } from "../../../plugins/synology-drive/connectors/ConnectorForm"

export const EditSynologyDriveConnectorScreen = memo(() => (
  <GenericEditConnectorScreen connectorType="synology-drive">
    {({ connectorId, onSubmitSuccess, deleteButton }) => (
      <ConnectorForm
        connectorId={connectorId}
        onSubmitSuccess={onSubmitSuccess}
      >
        {deleteButton}
      </ConnectorForm>
    )}
  </GenericEditConnectorScreen>
))
