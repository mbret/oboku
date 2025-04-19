import {
  Alert,
  Box,
  Button,
  Container,
  Link as MuiLink,
  List,
  ListItemText,
  Stack,
  ListItemButton,
  ListItemIcon,
} from "@mui/material"
import { links } from "@oboku/shared"
import { Link, useNavigate } from "react-router"
import { memo } from "react"
import { ROUTES } from "../../navigation/routes"
import { useConnectors } from "./connectors/useConnectors"
import { LinkRounded } from "@mui/icons-material"
import { useConnector } from "./connectors/useConnector"

const ConnectorListItem = memo(
  ({ id, onClick }: { id: string; onClick: () => void }) => {
    const { data: connector } = useConnector(id)

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

export const InfoScreen = () => {
  const { data: connectors } = useConnectors()
  const navigate = useNavigate()

  return (
    <>
      <Box display="flex" flex={1} overflow="auto" flexDirection="column">
        <Alert severity="info" variant="standard">
          Learn more about connectors{" "}
          <MuiLink href={links.documentationWebDAV}>here</MuiLink>
        </Alert>
        <Container maxWidth="sm">
          <Stack gap={1} mb={1} mt={2}>
            <Button
              component={Link}
              to={ROUTES.PLUGINS_WEBDAV_CONNECTORS_NEW.replace(
                ":type",
                "webdav",
              )}
              variant="contained"
            >
              Add a connector
            </Button>
          </Stack>
        </Container>
        <List>
          {connectors?.map((connector) => (
            <ConnectorListItem
              key={connector.id}
              id={connector.id}
              onClick={() => {
                navigate(
                  ROUTES.PLUGINS_WEBDAV_CONNECTORS_EDIT.replace(
                    ":id",
                    connector.id,
                  ),
                )
              }}
            />
          ))}
        </List>
      </Box>
    </>
  )
}
