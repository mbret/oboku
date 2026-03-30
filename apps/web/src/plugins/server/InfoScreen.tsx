import { memo } from "react"
import { ConnectorInfoSection } from "../../connectors/ConnectorInfoSection"

export const InfoScreen = memo(() => (
  <ConnectorInfoSection connectorType="server" maxConnectors={1} />
))
