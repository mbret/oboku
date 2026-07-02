import { Button, type ButtonProps } from "@mui/material"
import { Google } from "@mui/icons-material"
import { useConfig } from "../config/useConfig"

export const GoogleSignInButton = ({ disabled, ...props }: ButtonProps) => {
  const { data: config } = useConfig()

  return (
    <Button
      size="large"
      startIcon={<Google />}
      {...props}
      disabled={!config?.FEATURE_GOOGLE_SIGN_ENABLED || disabled}
    >
      Sign in with Google
    </Button>
  )
}
