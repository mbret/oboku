import { memo } from "react"
import { ConnectorInfoScreen } from "../../connectors/ConnectorInfoScreen"

export const InfoScreen = memo(() => (
  <ConnectorInfoScreen connectorType="server" maxConnectors={1} />
))
