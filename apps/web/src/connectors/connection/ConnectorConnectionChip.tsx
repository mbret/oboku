import { Chip, styled } from "@mui/material"
import { useConnectorConnection } from "./useConnectorConnection"

const StatusChip = styled(Chip)(function styleStatusChip({ theme }) {
  return {
    flexShrink: 0,
    marginLeft: theme.spacing(1),
  }
})

export function ConnectorConnectionChip({
  connectorId,
}: {
  connectorId: string
}) {
  const { data: connection } = useConnectorConnection({ connectorId })

  switch (connection?.status) {
    case "connected":
      return <StatusChip size="small" label="Connected" />
    case "connector-changed":
      return <StatusChip size="small" color="warning" label="Changed" />
    default:
      return null
  }
}
