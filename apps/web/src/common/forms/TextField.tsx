import { ContentCopyRounded } from "@mui/icons-material"
import {
  IconButton,
  InputAdornment,
  TextField as MuiTextField,
  type TextFieldProps as MuiTextFieldProps,
} from "@mui/material"
import { mergeSlotProps } from "@mui/material/utils"
import { notify } from "../../notifications/toasts"

type TextFieldProps = MuiTextFieldProps &
  (
    | { copyable?: false }
    | {
        /** Puts a copy button in the input's end adornment, in place of any `slotProps.input.endAdornment`. */
        copyable: true
        label: string
        value: string
      }
  )

export function TextField({
  copyable,
  label,
  value,
  slotProps,
  ...props
}: TextFieldProps) {
  const inputSlotProps = copyable
    ? mergeSlotProps(
        {
          endAdornment: <CopyValueInputAdornment label={label} value={value} />,
        },
        slotProps?.input ?? {},
      )
    : slotProps?.input

  return (
    <MuiTextField
      {...props}
      label={label}
      value={value}
      slotProps={{ ...slotProps, input: inputSlotProps }}
    />
  )
}

function CopyValueInputAdornment({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const copyValueToClipboard = async () => {
    await navigator.clipboard.writeText(value)

    notify({
      title: "Copied",
      description: `${label} copied to the clipboard`,
      severity: "success",
    })
  }

  return (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        onClick={copyValueToClipboard}
        aria-label={`Copy ${label}`}
      >
        <ContentCopyRounded fontSize="small" />
      </IconButton>
    </InputAdornment>
  )
}
