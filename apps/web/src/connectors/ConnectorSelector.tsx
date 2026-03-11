import type {
  SettingsConnectorDocType,
  SettingsConnectorType,
} from "@oboku/shared"
import { SettingsRounded } from "@mui/icons-material"
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  type ButtonProps,
  type TextFieldProps,
} from "@mui/material"
import { memo, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { CONNECTOR_DETAILS } from "./connectorDetails"
import { useConnectors } from "./useConnectors"

const ConnectorManagementButtons = memo(
  ({
    connectorType,
    onNavigate,
    variant = "outlined",
  }: {
    connectorType: SettingsConnectorType
    onNavigate?: () => void
    variant?: ButtonProps["variant"]
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
      <Stack direction="row" gap={1}>
        <Button
          onClick={handleManage}
          startIcon={<SettingsRounded />}
          variant={variant}
        >
          Manage connectors
        </Button>
        <Button onClick={handleNew} variant={variant}>
          New connector
        </Button>
      </Stack>
    )
  },
)

export type ConnectorSelectorProps = Omit<
  TextFieldProps,
  "select" | "children"
> & {
  connectorType: SettingsConnectorType
  connectors?: SettingsConnectorDocType[]
  showManagementButtons?: boolean
  onNavigate?: () => void
  children?: ReactNode
}

export const ConnectorSelector = memo(
  ({
    connectorType,
    connectors: connectorsProp,
    showManagementButtons = true,
    onNavigate,
    children,
    ref: refProp,
    helperText: helperTextProp,
    ...textFieldProps
  }: ConnectorSelectorProps) => {
    const { data: connectorsFromHook = [] } = useConnectors({
      type: connectorType,
    })
    const connectors = connectorsProp ?? connectorsFromHook
    const { label } = CONNECTOR_DETAILS[connectorType]
    const resolvedHelperText =
      helperTextProp ?? `Select the ${label} connector to use for browsing.`

    if (connectors.length === 0) {
      return (
        <>
          <Alert severity="warning">
            No {label} connector is available yet. Create one before continuing.
          </Alert>
          <ConnectorManagementButtons
            connectorType={connectorType}
            onNavigate={onNavigate}
          />
          {children}
        </>
      )
    }

    return (
      <Stack gap={2}>
        <TextField
          {...textFieldProps}
          fullWidth
          error={textFieldProps.error}
          helperText={helperTextProp ?? resolvedHelperText}
          inputRef={refProp}
          label={textFieldProps.label ?? "Connector"}
          select
          value={
            typeof textFieldProps.value === "string"
              ? textFieldProps.value
              : (textFieldProps.value ?? "")
          }
        >
          {connectors.map((connector) => (
            <MenuItem key={connector.id} value={connector.id}>
              {connector.url} ({connector.username})
            </MenuItem>
          ))}
        </TextField>
        {showManagementButtons && (
          <ConnectorManagementButtons
            connectorType={connectorType}
            onNavigate={onNavigate}
          />
        )}
        {children}
      </Stack>
    )
  },
)
