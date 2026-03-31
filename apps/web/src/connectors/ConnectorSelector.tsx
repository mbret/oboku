import type {
  SettingsConnectorDocType,
  SettingsConnectorType,
} from "@oboku/shared"
import { Alert, MenuItem, TextField, type TextFieldProps } from "@mui/material"
import { memo } from "react"
import { CONNECTOR_DETAILS } from "./connectorDetails"
import { useConnectors } from "./useConnectors"

export type ConnectorSelectorProps = Omit<
  TextFieldProps,
  "select" | "children"
> & {
  connectorType: SettingsConnectorType
  connectors?: SettingsConnectorDocType[]
}

export const ConnectorSelector = memo(
  ({
    connectorType,
    connectors: connectorsProp,
    ref: refProp,
    ...textFieldProps
  }: ConnectorSelectorProps) => {
    const { data: connectorsFromHook = [] } = useConnectors({
      type: connectorType,
    })
    const connectors = connectorsProp ?? connectorsFromHook
    const { label } = CONNECTOR_DETAILS[connectorType]

    if (connectors.length === 0) {
      return (
        <Alert severity="warning">
          No {label} connector is available yet. Create one before continuing.
        </Alert>
      )
    }

    return (
      <TextField
        {...textFieldProps}
        fullWidth
        error={textFieldProps.error}
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
    )
  },
)
