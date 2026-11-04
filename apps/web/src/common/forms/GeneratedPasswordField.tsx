import { Alert } from "@mui/material"
import { TextField } from "./TextField"

export function GeneratedPasswordField({ password }: { password: string }) {
  return (
    <>
      <TextField
        label="Password"
        value={password}
        copyable
        fullWidth
        slotProps={{ input: { readOnly: true } }}
      />
      <Alert severity="warning">
        Copy this password now: it is not shown again.
      </Alert>
    </>
  )
}
