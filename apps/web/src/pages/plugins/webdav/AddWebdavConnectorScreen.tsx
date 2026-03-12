import { memo } from "react"
import { AddConnectorScreen as GenericAddConnectorScreen } from "../../../connectors/AddConnectorScreen"
import { ConnectorForm } from "../../../plugins/webdav/connectors/ConnectorForm"

export const AddWebdavConnectorScreen = memo(() => (
  <GenericAddConnectorScreen connectorType="webdav">
    {({ onSubmitSuccess }) => (
      <ConnectorForm onSubmitSuccess={onSubmitSuccess} />
    )}
  </GenericAddConnectorScreen>
))
