import type { SettingsConnectorType } from "@oboku/shared"
import { SettingsRounded } from "@mui/icons-material"
import { Button, Stack, type ButtonProps } from "@mui/material"
import { memo } from "react"
import { useNavigate } from "react-router"
import { CONNECTOR_DETAILS } from "./connectorDetails"

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
    const { manageRoute, newRoute } = CONNECTOR_DETAILS[connectorType]

    const handleManage = () => {
      onNavigate?.()
      navigate(manageRoute)
    }

    const handleNew = () => {
      onNavigate?.()
      navigate(newRoute)
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
