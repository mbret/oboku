import { TextField } from "@mui/material"
import type { ComponentProps } from "react"
import { Controller, type FieldPath, type FieldValues } from "react-hook-form"
import { errorToHelperText } from "./errorToHelperText"

export const ControlledTextField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  rules,
  ...textFieldProps
}: Omit<
  ComponentProps<typeof Controller<TFieldValues, TName, TTransformedValues>>,
  "render"
> &
  ComponentProps<typeof TextField>) => {
  // react-hook-form is on React Compiler's incompatible-library list.
  // TODO: drop this opt-out once React Compiler handles react-hook-form, and verify the form still tracks state correctly.
  "use no memo"

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { ref, ...rest }, fieldState }) => {
        return (
          <TextField
            {...rest}
            {...textFieldProps}
            inputRef={ref}
            error={fieldState.invalid}
            helperText={
              fieldState.invalid
                ? errorToHelperText(fieldState.error)
                : textFieldProps.helperText
            }
          />
        )
      }}
    />
  )
}
