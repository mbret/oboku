import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  type SelectProps,
  TextField,
  type TextFieldProps,
} from "@mui/material"
import type { ComponentProps } from "react"
import { Controller, type FieldPath, type FieldValues } from "react-hook-form"
import { errorToHelperText } from "./errorToHelperText"

export const ControlledSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  rules,
  id,
  options,
  helperText,
  ...selectProps
}: Omit<
  ComponentProps<typeof Controller<TFieldValues, TName, TTransformedValues>>,
  "render"
> &
  SelectProps<string> & {
    options: { label: string; value: string; id: string }[]
    helperText?: string
  }) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { ref, value, ...rest }, fieldState }) => {
        const valueAsArray = Array.isArray(value) ? value : [value]
        const valuesNotInOptions = valueAsArray.filter(
          (v) => !options.some((o) => o.id === v),
        )
        const optionsWithMissingValues = [
          ...options,
          ...valuesNotInOptions.map((v) => ({
            label: v,
            value: v,
            id: v,
          })),
        ]

        return (
          <FormControl>
            <InputLabel>{selectProps.label}</InputLabel>
            <Select
              {...rest}
              {...selectProps}
              value={value}
              inputRef={ref}
              error={fieldState.invalid}
            >
              {optionsWithMissingValues.map((option) => (
                <MenuItem key={option.id} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {!!helperText && <FormHelperText>{helperText}</FormHelperText>}
          </FormControl>
        )
      }}
    />
  )
}
