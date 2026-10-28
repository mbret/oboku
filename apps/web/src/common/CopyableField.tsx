import { IconButton, InputAdornment, TextField } from "@mui/material"
import { ContentCopyRounded } from "@mui/icons-material"
import { notify } from "../notifications/toasts"

export function CopyableField({
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
    <TextField
      label={label}
      value={value}
      fullWidth
      slotProps={{
        input: {
          readOnly: true,
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
        },
      }}
    />
  )
}
