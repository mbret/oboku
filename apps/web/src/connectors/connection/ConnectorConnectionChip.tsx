import { Chip } from "@mui/material"
import { useConnectorConnection } from "./useConnectorConnection"

export function ConnectorConnectionChip({
  connectorId,
}: {
  connectorId: string
}) {
  const { data: connection } = useConnectorConnection({ connectorId })

  switch (connection?.status) {
    case "connected":
      return <Chip size="small" label="Connected" />
    case "connector-changed":
      return <Chip size="small" color="warning" label="Changed" />
    default:
      return null
  }
}
