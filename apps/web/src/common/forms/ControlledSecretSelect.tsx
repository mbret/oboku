import type { ComponentProps } from "react"
import type { FieldPath, FieldValues } from "react-hook-form"
import { ControlledSelect } from "./ControlledSelect"
import { useSecrets } from "../../secrets/useSecrets"
import { KeyRounded } from "@mui/icons-material"
import { InputAdornment } from "@mui/material"

export const ControlledSecretSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  ...rest
}: Omit<
  ComponentProps<
    typeof ControlledSelect<TFieldValues, TName, TTransformedValues>
  >,
  "options"
>) => {
  const { data: secrets = [] } = useSecrets()

  return (
    <ControlledSelect
      options={secrets?.map((secret) => ({
        label: secret.name,
        value: secret._id,
        id: secret._id,
      }))}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <KeyRounded />
            </InputAdornment>
          ),
        },
      }}
      helperText="Select a secret to use"
      {...rest}
    />
  )
}
