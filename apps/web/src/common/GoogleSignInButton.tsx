import { Button, type ButtonProps } from "@mui/material"
import { Google } from "@mui/icons-material"
import { configuration } from "../config/configuration"

export const GoogleSignInButton = ({ disabled, ...props }: ButtonProps) => (
  <Button
    size="large"
    startIcon={<Google />}
    {...props}
    disabled={!configuration.FEATURE_GOOGLE_SIGN_ENABLED || disabled}
  >
    Sign in with Google
  </Button>
)
