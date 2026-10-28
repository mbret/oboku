import { Alert } from "@mui/material"
import { CopyableField } from "./CopyableField"

export function OneTimePasswordField({ password }: { password: string }) {
  return (
    <>
      <CopyableField label="Password" value={password} />
      <Alert severity="warning">
        Copy this password now: it is not shown again.
      </Alert>
    </>
  )
}
