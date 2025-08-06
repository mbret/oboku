import { MenuItem, TextField, type TextFieldProps } from "@mui/material"
import type { ComponentProps } from "react"
import { Controller, type FieldPath, type FieldValues } from "react-hook-form"
import { errorToHelperText } from "./errorToHelperText"

export const ControlledTextFieldSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  rules,
  id,
  options,
  ...selectProps
}: Omit<
  ComponentProps<typeof Controller<TFieldValues, TName, TTransformedValues>>,
  "render"
> &
  TextFieldProps & {
    options: { label: string; value: string; id: string }[]
  }) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { ref, ...rest }, fieldState }) => {
        return (
          <TextField
            {...rest}
            {...selectProps}
            select
            inputRef={ref}
            error={fieldState.invalid}
            helperText={
              fieldState.invalid
                ? errorToHelperText(fieldState.error)
                : selectProps.helperText
            }
          >
            {options.map((option) => (
              <MenuItem key={option.id} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )
      }}
    />
  )
}
