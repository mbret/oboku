import { Delete } from "@mui/icons-material"
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  styled,
} from "@mui/material"
import { useState } from "react"
import { useController, type Control } from "react-hook-form"
import { ControlledTextField } from "../../../../common/forms/ControlledTextField"
import { errorToHelperText } from "../../../../common/forms/errorToHelperText"
import type { BookOptimizeFormValues } from "../../form"
import {
  CUSTOM_SCHEME_OPTION,
  IDENTIFIER_SCHEME_OPTIONS,
  identifierValuePlaceholder,
  isPredefinedIdentifierScheme,
  validateIdentifierScheme,
  validateIdentifierValue,
} from "./schemes"

const IdentifierGroupStack = styled(Stack)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
  gap: theme.spacing(2),
}))

const RemoveIdentifierStack = styled(Stack)({
  alignItems: "flex-end",
})

type Props = {
  control: Control<BookOptimizeFormValues>
  index: number
  unique: boolean
  disabled: boolean
  onRemove: () => void
}

export function IdentifierField({
  control,
  index,
  unique,
  disabled,
  onRemove,
}: Props) {
  const valueName = `identifiers.${index}.value` as const
  const schemeName = `identifiers.${index}.scheme` as const

  const {
    field: { value: scheme, onChange: changeScheme, onBlur: blurScheme, ref },
    fieldState: { error: schemeError, invalid: schemeInvalid },
  } = useController({
    control,
    name: schemeName,
    rules: { validate: validateIdentifierScheme, deps: [valueName] },
  })

  const [isCustomScheme, setIsCustomScheme] = useState(
    () => !isPredefinedIdentifierScheme(scheme),
  )

  return (
    <IdentifierGroupStack role="group" aria-label="Identifier">
      <FormControl size="small" fullWidth disabled={disabled}>
        <InputLabel>Scheme</InputLabel>
        <Select
          name={schemeName}
          label="Scheme"
          value={isCustomScheme ? CUSTOM_SCHEME_OPTION : scheme}
          onBlur={blurScheme}
          onChange={function selectScheme(event) {
            const selectsCustomScheme =
              event.target.value === CUSTOM_SCHEME_OPTION

            setIsCustomScheme(selectsCustomScheme)
            changeScheme(selectsCustomScheme ? "" : event.target.value)
          }}
        >
          {IDENTIFIER_SCHEME_OPTIONS.map(function renderSchemeOption(option) {
            return (
              <MenuItem key={option.scheme} value={option.scheme}>
                {option.label}
              </MenuItem>
            )
          })}
          <MenuItem value={CUSTOM_SCHEME_OPTION}>Custom…</MenuItem>
        </Select>
      </FormControl>
      {isCustomScheme && (
        <TextField
          name={schemeName}
          inputRef={ref}
          label="Custom scheme"
          placeholder="AcmeCatalog"
          size="small"
          fullWidth
          disabled={disabled}
          value={scheme}
          onBlur={blurScheme}
          onChange={changeScheme}
          error={schemeInvalid}
          helperText={
            schemeInvalid ? errorToHelperText(schemeError) : undefined
          }
        />
      )}
      <ControlledTextField<BookOptimizeFormValues, typeof valueName>
        control={control}
        name={valueName}
        rules={{
          validate: function validateValueAgainstItsScheme(value, values) {
            return validateIdentifierValue(
              values.identifiers[index]?.scheme ?? "",
              value,
            )
          },
        }}
        label="Value"
        placeholder={identifierValuePlaceholder(scheme)}
        size="small"
        fullWidth
        disabled={disabled}
      />
      <RemoveIdentifierStack>
        <Tooltip
          title={
            unique
              ? "This is the book's unique identifier and cannot be removed"
              : ""
          }
        >
          <span>
            <Button
              aria-label="Remove identifier"
              size="small"
              color="inherit"
              startIcon={<Delete />}
              disabled={disabled || unique}
              onClick={onRemove}
            >
              Remove
            </Button>
          </span>
        </Tooltip>
      </RemoveIdentifierStack>
    </IdentifierGroupStack>
  )
}
