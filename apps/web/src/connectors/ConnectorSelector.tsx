import type { SettingsConnectorDocType } from "@oboku/shared"
import { Alert, MenuItem, TextField, type TextFieldProps } from "@mui/material"
import { memo } from "react"
import type { ConnectorDetails } from "../integrations/plugins/types"
import { useConnectors } from "./useConnectors"

export type ConnectorSelectorProps = Omit<
  TextFieldProps,
  "select" | "children"
> & {
  connector: ConnectorDetails
  connectors?: SettingsConnectorDocType[]
}

export const ConnectorSelector = memo(function ConnectorSelector({
  connector: { type: connectorType, label },
  connectors: connectorsProp,
  ref: refProp,
  ...textFieldProps
}: ConnectorSelectorProps) {
  const { data: connectorsFromHook = [] } = useConnectors({
    type: connectorType,
  })
  const connectors = connectorsProp ?? connectorsFromHook

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
})
