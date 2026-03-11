import { memo } from "react"
import { AddConnectorScreen as GenericAddConnectorScreen } from "../../../connectors/AddConnectorScreen"
import { ConnectorForm } from "../../../plugins/synology-drive/connectors/ConnectorForm"

export const AddSynologyDriveConnectorScreen = memo(() => (
  <GenericAddConnectorScreen connectorType="synology-drive">
    {({ onSubmitSuccess }) => (
      <ConnectorForm onSubmitSuccess={onSubmitSuccess} />
    )}
  </GenericAddConnectorScreen>
))
