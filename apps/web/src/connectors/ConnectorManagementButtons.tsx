import { SettingsRounded } from "@mui/icons-material"
import { Button, Stack, type ButtonProps } from "@mui/material"
import { memo } from "react"
import { generatePath, useNavigate } from "react-router"
import { ROUTES } from "../navigation/routes"
import type { ConnectorDetails } from "../integrations/plugins/types"

export const ConnectorManagementButtons = memo(
  function ConnectorManagementButtons({
    connector,
    onNavigate,
    variant = "outlined",
    showNewButton = true,
  }: {
    connector: ConnectorDetails
    onNavigate?: () => void
    variant?: ButtonProps["variant"]
    showNewButton?: boolean
  }) {
    const navigate = useNavigate()

    const handleManage = () => {
      onNavigate?.()
      navigate(connector.integrationRoute)
    }

    const handleNew = () => {
      onNavigate?.()
      navigate(
        generatePath(ROUTES.INTEGRATION_CONNECTORS_NEW, {
          type: connector.type,
        }),
      )
    }

    return (
      <Stack
        direction="row"
        sx={{
          gap: 1,
        }}
      >
        <Button
          onClick={handleManage}
          startIcon={<SettingsRounded />}
          variant={variant}
        >
          Manage connectors
        </Button>
        {showNewButton && (
          <Button onClick={handleNew} variant={variant}>
            New connector
          </Button>
        )}
      </Stack>
    )
  },
)
