import { LinkRounded } from "@mui/icons-material"
import {
  Alert,
  Box,
  Button,
  Link as MuiLink,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { memo } from "react"
import { Link as RouterLink, useNavigate } from "react-router"
import type { SettingsConnectorType } from "@oboku/shared"
import { CONNECTOR_DETAILS } from "./connectorDetails"
import { useConnector } from "./useConnector"
import { useConnectors } from "./useConnectors"
import { links } from "@oboku/shared"

const ConnectorListItem = memo(
  ({
    id,
    onClick,
    connectorType,
  }: {
    id: string
    connectorType: SettingsConnectorType
    onClick: () => void
  }) => {
    const { data: connector } = useConnector({ id, type: connectorType })

    return (
      <ListItemButton onClick={onClick}>
        <ListItemIcon>
          <LinkRounded />
        </ListItemIcon>
        <ListItemText
          primary={connector?.url}
          secondary={`${connector?.username}@********`}
        />
      </ListItemButton>
    )
  },
)

export const ConnectorInfoScreen = memo(
  ({ connectorType }: { connectorType: SettingsConnectorType }) => {
    const { data: connectors } = useConnectors({ type: connectorType })
    const navigate = useNavigate()
    const details = CONNECTOR_DETAILS[connectorType]

    return (
      <Box display="flex" flex={1} flexDirection="column" overflow="auto">
        <Alert severity="info" variant="standard">
          Learn more about connectors{" "}
          <MuiLink
            href={links.documentationConnectors}
            rel="noopener noreferrer"
            target="_blank"
          >
            here
          </MuiLink>
        </Alert>
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent={{ sm: "flex-start" }}
          mb={1}
          mt={2}
          px={2}
        >
          <Button
            component={RouterLink}
            to={details.newRoute}
            variant="contained"
          >
            Add a connector
          </Button>
        </Box>
        <List>
          {connectors?.map((connector) => (
            <ConnectorListItem
              id={connector.id}
              key={connector.id}
              connectorType={connectorType}
              onClick={() => {
                navigate(details.editRoute.replace(":id", connector.id))
              }}
            />
          ))}
        </List>
      </Box>
    )
  },
)
