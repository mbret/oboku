import type { SettingsConnectorType } from "@oboku/shared"
import { SettingsRounded } from "@mui/icons-material"
import { Button, Stack, type ButtonProps } from "@mui/material"
import { memo } from "react"
import { generatePath, useNavigate } from "react-router"
import { ROUTES } from "../navigation/routes"

export const ConnectorManagementButtons = memo(
  ({
    connectorType,
    onNavigate,
    variant = "outlined",
    showNewButton = true,
  }: {
    connectorType: SettingsConnectorType
    onNavigate?: () => void
    variant?: ButtonProps["variant"]
    showNewButton?: boolean
  }) => {
    const navigate = useNavigate()

    const handleManage = () => {
      onNavigate?.()
      navigate(generatePath(ROUTES.INTEGRATION_DETAILS, { id: connectorType }))
    }

    const handleNew = () => {
      onNavigate?.()
      navigate(
        generatePath(ROUTES.INTEGRATION_CONNECTORS_NEW, {
          type: connectorType,
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
