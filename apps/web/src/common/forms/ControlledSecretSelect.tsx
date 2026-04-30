import { KeyRounded } from "@mui/icons-material"
import {
  InputAdornment,
  MenuItem,
  TextField,
  type TextFieldProps,
} from "@mui/material"
import type { ComponentProps } from "react"
import { Controller, type FieldPath, type FieldValues } from "react-hook-form"
import { useSecrets } from "../../secrets/useSecrets"
import { errorToHelperText } from "./errorToHelperText"

export const ControlledSecretSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  rules,
  helperText = "Select a secret to use",
  slotProps = {
    input: {
      startAdornment: (
        <InputAdornment position="start">
          <KeyRounded />
        </InputAdornment>
      ),
    },
  },
  ...selectProps
}: Omit<
  ComponentProps<typeof Controller<TFieldValues, TName, TTransformedValues>>,
  "render"
> &
  TextFieldProps) => {
  const { data: secrets = [] } = useSecrets()

  const options = secrets.map((secret) => ({
    label: secret.name,
    value: secret._id,
    id: secret._id,
  }))

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
            slotProps={slotProps}
            error={fieldState.invalid}
            helperText={
              fieldState.invalid
                ? errorToHelperText(fieldState.error)
                : helperText
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
