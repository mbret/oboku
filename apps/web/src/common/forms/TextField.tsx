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
        /** Adds a button that copies `value` to the clipboard. */
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
  if (!copyable) {
    return (
      <MuiTextField
        {...props}
        label={label}
        value={value}
        slotProps={slotProps}
      />
    )
  }

  const copyValueToClipboard = async () => {
    await navigator.clipboard.writeText(value)

    notify({
      title: "Copied",
      description: `${label} copied to the clipboard`,
      severity: "success",
    })
  }

  return (
    <MuiTextField
      {...props}
      label={label}
      value={value}
      slotProps={{
        ...slotProps,
        input: mergeSlotProps(slotProps?.input, {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={copyValueToClipboard}
                aria-label={`Copy ${label}`}
              >
                <ContentCopyRounded fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }),
      }}
    />
  )
}
