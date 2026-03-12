import { memo } from "react"
import { EditConnectorScreen as GenericEditConnectorScreen } from "../../../connectors/EditConnectorScreen"
import { ConnectorForm } from "../../../plugins/webdav/connectors/ConnectorForm"

export const EditWebDavConnectorScreen = memo(() => (
  <GenericEditConnectorScreen connectorType="webdav">
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
