import type { ComponentProps } from "react"
import { Controller, type FieldPath, type FieldValues } from "react-hook-form"
import {
  ConnectorSelector,
  type ConnectorSelectorProps,
} from "../../connectors/ConnectorSelector"
import { errorToHelperText } from "./errorToHelperText"

export const ControlledConnectorSelector = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  rules,
  ...connectorSelectorProps
}: Omit<
  ComponentProps<typeof Controller<TFieldValues, TName, TTransformedValues>>,
  "render"
> &
  ConnectorSelectorProps) => {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={function renderConnectorSelector({ field, fieldState }) {
        return (
          <ConnectorSelector
            {...field}
            {...connectorSelectorProps}
            helperText={
              fieldState.invalid
                ? errorToHelperText(fieldState.error)
                : connectorSelectorProps.helperText
            }
            error={fieldState.invalid}
          />
        )
      }}
    />
  )
}
